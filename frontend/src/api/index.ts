export * from './auth';
export * from './templates';
export * from './workOrders';
export * from './files';
export * from './users';
export * from './roles';
export * from './parts';

import * as Auth from './auth';
import * as Templates from './templates';
import * as WorkOrders from './workOrders';
import * as Files from './files';
import * as Users from './users';
import * as Roles from './roles';
import * as Parts from './parts';

export default {
  Auth,
  Templates,
  WorkOrders,
  Files,
  Users,
  Roles,
  Parts,
};
