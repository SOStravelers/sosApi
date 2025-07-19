import mongoose from "mongoose";
const Schema = mongoose.Schema;

const paymentSchema = new Schema(
  {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
    },
    status: {
      type: String,
      default: "pending",
      enum: ["pending", "paid", "failed", "canceled", "refunded"],
    },
    paymentMethod: {
      type: String,
      enum: ["credit_card", "paypal", "stripe"],
      required: true,
    },
    transactionId: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    amountPaid: {
      type: Number,
      required: true,
    },
    currency: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Currency",
      required: true,
    },
  },
  { timestamps: true }
);

const Payment = mongoose.model("Payment", paymentSchema);

export default Payment;
