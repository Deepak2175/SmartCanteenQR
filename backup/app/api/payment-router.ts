import { z } from "zod";
import { createRouter, publicQuery } from "./middleware";

export const paymentRouter = createRouter({
  // Simulate UPI payment
  processUpi: publicQuery
    .input(
      z.object({
        amount: z.number().positive(),
        upiId: z.string().min(1),
      })
    )
    .mutation(async () => {
      // Simulate payment processing delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Simulate 95% success rate
      const success = Math.random() > 0.05;

      if (!success) {
        return {
          success: false,
          transactionId: null,
          message: "Payment failed. Please try again.",
        };
      }

      const transactionId = `UPI${Date.now()}${Math.floor(Math.random() * 10000)}`;

      return {
        success: true,
        transactionId,
        message: "Payment successful",
      };
    }),

  // Simulate card payment
  processCard: publicQuery
    .input(
      z.object({
        amount: z.number().positive(),
        cardNumber: z.string().min(16).max(16),
        expiry: z.string(),
        cvv: z.string().min(3).max(4),
      })
    )
    .mutation(async () => {
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const success = Math.random() > 0.05;

      if (!success) {
        return {
          success: false,
          transactionId: null,
          message: "Payment failed. Please try again.",
        };
      }

      const transactionId = `CARD${Date.now()}${Math.floor(Math.random() * 10000)}`;

      return {
        success: true,
        transactionId,
        message: "Payment successful",
      };
    }),
});
