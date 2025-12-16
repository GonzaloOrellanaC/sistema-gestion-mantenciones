import Counter from '../models/Counter';
import mongoose from 'mongoose';

export async function getNextSequence(orgId: string) {
  if (!mongoose.Types.ObjectId.isValid(orgId)) throw { status: 400, message: 'Invalid orgId' };

  const result = await Counter.findOneAndUpdate(
    { orgId },
    { $inc: { seq: 1 } },
    { upsert: true, returnDocument: 'after' }
  );

  if (!result) throw { status: 500, message: 'Could not get next sequence' };
  return result.seq;
}

export default { getNextSequence };
