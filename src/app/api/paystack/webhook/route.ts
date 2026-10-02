import { and, eq, gte, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import {
  emailLogs,
  orderItems,
  orders,
  payments,
  productVariants,
  products,
} from "@/lib/db/schema";
import {
  isMatchingSuccessfulPayment,
  isValidPaystackSignature,
} from "@/lib/paystack";
import { sendOrderConfirmationEmail } from "@/lib/email";

type PaystackVerification = {
  status?: boolean;
  data?: {
    status?: string;
    reference?: string;
    amount?: number;
    currency?: string;
  };
};

type EmailOrder = {
  orderId: string;
  orderNumber: string;
  customerEmail: string;
  customerName: string;
  totalCents: number;
  currency: string;
};

export async function POST(request: Request) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret || !process.env.DATABASE_URL) {
    return NextResponse.json(
      { error: "Webhook is not configured." },
      { status: 503 }
    );
  }

  const rawBody = Buffer.from(await request.arrayBuffer());
  const signature = request.headers.get("x-paystack-signature") ?? "";

  if (!isValidPaystackSignature(rawBody, signature, secret)) {
    return NextResponse.json(
      { error: "Invalid signature." },
      { status: 401 }
    );
  }

  let event: {
    event?: string;
    data?: {
      reference?: string;
    };
  };

  try {
    event = JSON.parse(rawBody.toString("utf8")) as typeof event;
  } catch {
    return NextResponse.json(
      { error: "Invalid payload." },
      { status: 400 }
    );
  }

  if (event.event !== "charge.success" || !event.data?.reference) {
    return NextResponse.json({ received: true });
  }

  const reference = event.data.reference;

  try {
    /*
     * Verify the transaction directly with Paystack.
     * We do not trust the webhook payload alone.
     */
    const verificationResponse = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        headers: {
          Authorization: `Bearer ${secret}`,
        },
        cache: "no-store",
      }
    );

    const verification = (await verificationResponse.json()) as PaystackVerification;
    const verified = verification.data;

    if (
      !verificationResponse.ok ||
      !verification.status ||
      verified?.status !== "success" ||
      verified.reference !== reference
    ) {
      return NextResponse.json(
        { error: "Transaction verification failed." },
        { status: 400 }
      );
    }

    const db = getDb();

    /*
     * Finalize payment and inventory inside one database transaction.
     * The returned order information is used for the email notification.
     */
    const emailOrder = await db.transaction(async (tx): Promise<EmailOrder> => {
      const [payment] = await tx
        .select()
        .from(payments)
        .where(eq(payments.reference, reference))
        .for("update");

      if (!payment) {
        throw new Error("Unknown payment reference.");
      }

      const [order] = await tx
        .select()
        .from(orders)
        .where(eq(orders.id, payment.orderId))
        .for("update");

      if (!order) {
        throw new Error("Order not found.");
      }

      /*
       * If Paystack retries the webhook after the payment has already
       * been finalized, do not decrement stock again.
       */
      if (payment.status !== "paid") {
        if (
          !isMatchingSuccessfulPayment(verified, {
            reference,
            amount: payment.amountCents,
            currency: payment.currency,
          })
        ) {
          throw new Error(
            "Verified amount or currency does not match the order."
          );
        }

        const items = await tx
          .select()
          .from(orderItems)
          .where(eq(orderItems.orderId, order.id));

        /*
         * Keep inventory updates in a deterministic order.
         * This reduces the chance of concurrent orders locking
         * products in different orders.
         */
        for (const item of [...items].sort((left, right) =>
          (left.productId ?? "").localeCompare(right.productId ?? "")
        )) {
          if (!item.productId) {
            throw new Error(
              "An ordered product is no longer available for inventory reconciliation."
            );
          }

          const updated = await tx
            .update(products)
            .set({
              stockQuantity: sql`${products.stockQuantity} - ${item.quantity}`,
              updatedAt: new Date(),
            })
            .where(
              and(
                eq(products.id, item.productId),
                gte(products.stockQuantity, item.quantity)
              )
            )
            .returning({ id: products.id });

          if (updated.length !== 1) {
            throw new Error(
              "Insufficient stock to finalize this paid order."
            );
          }

          if (item.variantId) {
            const variantUpdate = await tx
              .update(productVariants)
              .set({
                stockQuantity: sql`${productVariants.stockQuantity} - ${item.quantity}`,
              })
              .where(
                and(
                  eq(productVariants.id, item.variantId),
                  eq(productVariants.productId, item.productId),
                  eq(productVariants.active, true),
                  gte(productVariants.stockQuantity, item.quantity)
                )
              )
              .returning({ id: productVariants.id });

            if (variantUpdate.length !== 1) {
              throw new Error(
                "Insufficient stock for the selected product color."
              );
            }
          }
        }

        await tx
          .update(payments)
          .set({
            status: "paid",
            verifiedAt: new Date(),
            providerData: verified,
          })
          .where(eq(payments.id, payment.id));

        await tx
          .update(orders)
          .set({
            paymentStatus: "paid",
            status: "confirmed",
            updatedAt: new Date(),
          })
          .where(eq(orders.id, order.id));
      }

      return {
        orderId: order.id,
        orderNumber: order.orderNumber,
        customerEmail: order.customerEmail,
        customerName: order.customerName,
        totalCents: order.totalCents,
        currency: order.currency,
      };
    });

    /*
     * Email delivery happens AFTER the payment transaction succeeds.
     *
     * The template identifier contains the order ID so the same order
     * cannot receive multiple "sent" confirmation records.
     */
    const emailTemplate = `order-confirmation:${emailOrder.orderId}`;
    const [alreadySent] = await db
      .select({ id: emailLogs.id })
      .from(emailLogs)
      .where(
        and(
          eq(emailLogs.recipient, emailOrder.customerEmail),
          eq(emailLogs.template, emailTemplate),
          eq(emailLogs.status, "sent")
        )
      )
      .limit(1);

    if (!alreadySent) {
      try {
        await sendOrderConfirmationEmail({
          to: emailOrder.customerEmail,
          customerName: emailOrder.customerName,
          orderNumber: emailOrder.orderNumber,
          totalCents: emailOrder.totalCents,
          currency: emailOrder.currency,
        });

        await db.insert(emailLogs).values({
          recipient: emailOrder.customerEmail,
          template: emailTemplate,
          status: "sent",
        });
      } catch (emailError) {
        const emailMessage =
          emailError instanceof Error ? emailError.message : "Email delivery failed.";
        console.error("Order confirmation email failed:", emailMessage);

        /*
         * The payment itself is already successful.
         * We record the email failure without turning the successful
         * payment webhook into a failed payment.
         *
         * A later Paystack webhook retry can attempt the email again
         * because only successful emails are treated as already sent.
         */
        await db.insert(emailLogs).values({
          recipient: emailOrder.customerEmail,
          template: emailTemplate,
          status: "failed",
          error: emailMessage,
        });
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error(
      "Paystack webhook processing failed:",
      error instanceof Error ? error.message : "unknown error"
    );
    return NextResponse.json(
      { error: "Payment event could not be finalized." },
      { status: 500 }
    );
  }
}
