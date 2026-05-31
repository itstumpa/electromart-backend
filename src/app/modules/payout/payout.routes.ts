import { Router } from 'express';
// import { authenticate, authorize } from '../modules/auth';
import { validate } from '../../middlewares/validate';
import { requestPayoutSchema } from './payout.validation';
import * as PayoutController from './payout.controller';
import { authorize } from '../../middlewares/authorize';
import { authenticate } from '../../middlewares/authenticate';

const router = Router();

router.use(authenticate, authorize('VENDOR'));

router.get('/my',           PayoutController.getMyPayouts);
router.get('/transactions', PayoutController.getMyTransactions);
router.post('/request',     validate(requestPayoutSchema), PayoutController.requestPayout);


export const payoutRoute = router;
