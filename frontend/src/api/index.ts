export * from './auth';
export * from './templates';
export * from './workOrders';
export * from './files';
export * from './users';
export * from './roles';

import * as Auth from './auth';
import * as Templates from './templates';
import * as WorkOrders from './workOrders';
import * as Files from './files';
import * as Users from './users';
import * as Roles from './roles';

export default {
  Auth,
  Templates,
  WorkOrders,
  Files,
  Users,
  Roles,
};
