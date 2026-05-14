import mongoose from "mongoose";

const CounterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
});

export const CounterModel = mongoose.model("Counter", CounterSchema);

export async function getNextSequence(name: string): Promise<number> {
  const counter = await CounterModel.findOneAndUpdate(
    { _id: name },
    { $inc: { seq: 1 } },
    { new: true, upsert: true },
  );
  return counter!.seq;
}
