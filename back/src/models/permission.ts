import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

const PermissionSchema = new Schema(
  {
    role: { type: String, required: true, index: true },
    resource: { type: String, required: true },
    action: { type: String, required: true },
  },
  { timestamps: true, collection: 'permissions' },
);

PermissionSchema.index({ role: 1, resource: 1, action: 1 }, { unique: true });

export type Permission = InferSchemaType<typeof PermissionSchema> & { _id: Schema.Types.ObjectId };
export const PermissionModel: Model<Permission> = model<Permission>('Permission', PermissionSchema);
