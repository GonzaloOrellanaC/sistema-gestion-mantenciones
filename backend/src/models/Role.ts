import mongoose, { Schema } from 'mongoose';

export interface IPermissions {
  editarUsuarios?: boolean;
  verPautas?: boolean;
  crearPautas?: boolean;
  editarPautas?: boolean;
  asignarOT?: boolean;
  supervisar?: boolean;
  aprobarRechazar?: boolean;
  crearRoles?: boolean;
  editarRoles?: boolean;
  agregarGerencias?: boolean;
  editarGerencias?: boolean;
  crearSucursales?: boolean;
  editarSucursales?: boolean;
  crearInsumos?: boolean;
  editarInsumos?: boolean;
  crearElementos?: boolean;
  editarElementos?: boolean;
}

export interface IRole {
  orgId: Schema.Types.ObjectId;
  name: string;
  permissions: IPermissions;
  hierarchyLevel?: number;
}

const RoleSchema = new Schema<IRole>({
  orgId: { type: Schema.Types.ObjectId, required: true, index: true },
  name: { type: String, required: true },
  permissions: { type: Schema.Types.Mixed, default: {} },
  hierarchyLevel: { type: Number, default: 0 }
});

export default mongoose.model<IRole>('Role', RoleSchema);
