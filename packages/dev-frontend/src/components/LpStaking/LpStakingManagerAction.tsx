import { Button } from "theme-ui";

import { Decimal, LPStakeChange } from "@liquity/lib-base";

import { useLiquity } from "../../hooks/LiquityContext";
import { useTransactionFunction } from "../Transaction";

type StakingActionProps = {
  change: LPStakeChange<Decimal>;
  needApproveAction: boolean;
  needApproveActionAmount?: Decimal;
};

export const StakingManagerAction: React.FC<StakingActionProps> = ({
  change,
  needApproveAction,
  needApproveActionAmount = Decimal.ZERO,
  children
}) => {
  const { liquity } = useLiquity();

  const [sendTransaction] = useTransactionFunction(
    "lpstake",
    change.stakeLP
      ? needApproveAction
        ? liquity.send.approveUniTokens.bind(liquity.send, needApproveActionAmount)
        : liquity.send.stakeUniTokens.bind(liquity.send, change.stakeLP)
      : liquity.send.unstakeUniTokens.bind(liquity.send, change.unstakeLP)
  );

  return <Button onClick={sendTransaction}>{children}</Button>;
};
