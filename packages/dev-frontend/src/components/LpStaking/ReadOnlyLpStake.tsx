import { Heading, Box, Card, Flex, Button } from "theme-ui";

import { LiquityStoreState, LPStake } from "@liquity/lib-base";
import { useLiquitySelector } from "@liquity/lib-react";

import { GT, LP } from "../../strings";

import { DisabledEditableRow, StaticRow } from "../Trove/Editor";
import { LoadingOverlay } from "../LoadingOverlay";
import { Icon } from "../Icon";

import { useLpStakingView } from "./context/LpStakingViewContext";
import { LpStakingGainsAction } from "./LpStakingGainsAction";

const select = ({
  liquidityMiningLQTYReward,
  liquidityMiningStake,
  totalStakedLQTY
}: LiquityStoreState) => ({
  lqtyStake: new LPStake(liquidityMiningStake, liquidityMiningLQTYReward),
  totalStakedLQTY
});

export const ReadOnlyLpStake: React.FC = () => {
  const { changePending, dispatch } = useLpStakingView();
  const { lqtyStake } = useLiquitySelector(select);

  // const poolShare = lqtyStake.stakedLQTY.mulDiv(100, totalStakedLQTY);

  return (
    <Card>
      <Heading>Uni Lp Staking</Heading>

      <Box sx={{ p: [2, 3] }}>
        <DisabledEditableRow
          label="Stake"
          inputId="stake-lqty"
          amount={lqtyStake.stakedLP.prettify()}
          unit={LP}
        />

        {/* <StaticRow
          label="Pool share"
          inputId="stake-share"
          amount={poolShare.prettify(4)}
          unit="%"
        /> */}

        {/* <StaticRow
          label="Redemption gain"
          inputId="stake-gain-eth"
          amount={lqtyStake.collateralGain.prettify(4)}
          color={lqtyStake.collateralGain.nonZero && "success"}
          unit="ETH"
        /> */}

        <StaticRow
          label="Issuance gain"
          inputId="stake-gain-lusd"
          amount={lqtyStake.lqtyReward.prettify()}
          color={lqtyStake.lqtyReward.nonZero && "success"}
          unit={GT}
        />

        <Flex variant="layout.actions">
          <Button variant="outline" onClick={() => dispatch({ type: "startAdjusting" })}>
            <Icon name="pen" size="sm" />
            &nbsp;Adjust
          </Button>
          <LpStakingGainsAction />
        </Flex>
      </Box>

      {changePending && <LoadingOverlay />}
    </Card>
  );
};
