import { Button } from "theme-ui";

import { LiquityStoreState } from "@liquity/lib-base";
import { useLiquitySelector } from "@liquity/lib-react";

import { useLiquity } from "../../hooks/LiquityContext";
import { useTransactionFunction } from "../Transaction";

const selectLiquidityMiningLQTYReward = ({ liquidityMiningLQTYReward }: LiquityStoreState) =>
  liquidityMiningLQTYReward;

export const LpStakingGainsAction: React.FC = () => {
  const { liquity } = useLiquity();
  const liquidityMiningLQTYReward = useLiquitySelector(selectLiquidityMiningLQTYReward);

  const [sendTransaction] = useTransactionFunction(
    "lpstake",
    liquity.send.withdrawLQTYRewardFromLiquidityMining.bind(liquity.send)
  );

  return (
    <Button onClick={sendTransaction} disabled={liquidityMiningLQTYReward.isZero}>
      Claim gains
    </Button>
  );
};
