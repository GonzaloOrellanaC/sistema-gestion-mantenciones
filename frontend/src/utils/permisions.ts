export type Permission = 
    "verTablero" |
    "verUsuarios" |
    "crearUsuarios" |
    "editarUsuarios" |
    "verPautas" |
    "crearPautas" |
    "editarPautas" |
    "verOT" |
    "crearOT" |
    "editarOT" |
    "asignarOT" |
    "ejecutarOT" |
    "supervisar" |
    "aprobarRechazar" |
    "verRoles" |
    "crearRoles" |
    "editarRoles" |
    "verOrganizacion" |
    "editarOrganizacion" |
    "verOrganization" |
    "editarOrganization" |
    "verActivos" |
    "crearActivos" |
    "editarActivos" |
    "verSucursales" |
    "crearSucursales" |
    "editarSucursales" |
    "verInsumos" |
    "crearInsumos" |
    "editarInsumos" |
    "verRepuestos" |
    "crearRepuestos" |
    "editarRepuestos" |
    "verLotes" |
    "crearLotes" |
    "editarLotes";


/**
 * Verifica si un rol tiene un permiso específico.
 * 
 * @param role - El rol del usuario.
 * @param permission - El permiso a verificar.
 * @returns `true` si el rol tiene el permiso, `false` en caso contrario.
 */

export const hasPermission = (
    permissions: { [key: string]: boolean } | null,
    permission: Permission
) => {
  if (!permissions || !permissions[permission]) return false;
  return permissions[permission] === true;
}