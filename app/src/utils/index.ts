export * from './push';
export * from './camera';

import push from './push';
import camera from './camera';

export default { ...push, ...camera };
