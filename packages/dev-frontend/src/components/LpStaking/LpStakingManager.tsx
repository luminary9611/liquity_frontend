import React from "react";
import { Button, Flex } from "theme-ui";

import { Decimal, Decimalish, LiquityStoreState, LPStake, LPStakeChange } from "@liquity/lib-base";

import { LiquityStoreUpdate, useLiquityReducer, useLiquitySelector } from "@liquity/lib-react";

import { LP, GT } from "../../strings";

import { useLpStakingView } from "./context/LpStakingViewContext";
import { LpStakingEditor } from "./LpStakingEditor";
import { StakingManagerAction } from "./LpStakingManagerAction";
import { ActionDescription, Amount } from "../ActionDescription";
import { ErrorDescription } from "../ErrorDescription";

const init = ({
  // uniTokenBalance,
  // uniTokenAllowance,
  // totalStakedUniTokens,
  liquidityMiningLQTYReward,
  liquidityMiningStake
}: LiquityStoreState) => ({
  originalStake: new LPStake(liquidityMiningStake, liquidityMiningLQTYReward),
  editedUniLp: liquidityMiningStake
});

type StakeManagerState = ReturnType<typeof init>;
type StakeManagerAction =
  | LiquityStoreUpdate
  | { type: "revert" }
  | { type: "setStake"; newValue: Decimalish };

const reduce = (state: StakeManagerState, action: StakeManagerAction): StakeManagerState => {
  const { originalStake, editedUniLp } = state;

  switch (action.type) {
    case "setStake":
      return { ...state, editedUniLp: Decimal.from(action.newValue) };

    case "revert":
      return { ...state, editedUniLp: originalStake.stakedLP };

    case "updateStore": {
      const {
        // stateChange: { lqtyStake: updatedStake }
        stateChange: {
          liquidityMiningStake: updatedLiquidityMiningStake,
          liquidityMiningLQTYReward: updatedLiquidityMiningLQTYReward
        }
      } = action;

      if (updatedLiquidityMiningStake && updatedLiquidityMiningLQTYReward) {
        const updatedLpStake = new LPStake(
          updatedLiquidityMiningStake,
          updatedLiquidityMiningLQTYReward
        );

        return {
          originalStake: updatedLpStake,
          editedUniLp: updatedLpStake.apply(originalStake.whatChanged(editedUniLp))
        };
      }
    }
  }

  return state;
};

const selectUniLpInfo = ({ uniTokenBalance, uniTokenAllowance }: LiquityStoreState) => ({
  uniTokenBalance,
  uniTokenAllowance
});

type StakingManagerActionDescriptionProps = {
  originalStake: LPStake;
  change: LPStakeChange<Decimal>;
};

const LpStakingManagerActionDescription: React.FC<StakingManagerActionDescriptionProps> = ({
  originalStake,
  change
}) => {
  const stakeUniLp = change.stakeLP?.prettify().concat(" ", LP);
  const unstakeUniLp = change.unstakeLP?.prettify().concat(" ", LP);
  const lqtyGain = originalStake.lqtyReward.nonZero?.prettify().concat(" ", GT);

  if (originalStake.isEmpty && stakeUniLp) {
    return (
      <ActionDescription>
        You are staking <Amount>{stakeUniLp}</Amount>.
      </ActionDescription>
    );
  }

  return (
    <ActionDescription>
      {stakeUniLp && (
        <>
          You are adding <Amount>{stakeUniLp}</Amount> to your stake
        </>
      )}
      {unstakeUniLp && (
        <>
          You are withdrawing <Amount>{unstakeUniLp}</Amount> to your wallet
        </>
      )}
      {/* {lqtyGain && (
        <>
          {" "}
          and claiming{" "}
          {lqtyGain && (
            <>
              <Amount>{lqtyGain}</Amount>
            </>
          )}
        </>
      )} */}
      .
    </ActionDescription>
  );
};

export const LpStakingManager: React.FC = () => {
  const { dispatch: dispatchStakingViewAction } = useLpStakingView();
  const [{ originalStake, editedUniLp }, dispatch] = useLiquityReducer(reduce, init);
  const { uniTokenBalance, uniTokenAllowance } = useLiquitySelector(selectUniLpInfo);

  const change = originalStake.whatChanged(editedUniLp);
  const [validChange, description] = !change
    ? [undefined, undefined]
    : change.stakeLP?.gt(uniTokenBalance)
    ? [
        undefined,
        <ErrorDescription>
          The amount you're trying to stake exceeds your balance by{" "}
          <Amount>
            {change.stakeLP.sub(uniTokenBalance).prettify()} {LP}
          </Amount>
          .
        </ErrorDescription>
      ]
    : [change, <LpStakingManagerActionDescription originalStake={originalStake} change={change} />];

  const makingNewStake = originalStake.isEmpty;

  const needApproveAction =
    change &&
    change.stakeLP &&
    change.stakeLP?.lte(uniTokenBalance) &&
    originalStake.stakedLP.add(change.stakeLP).gt(uniTokenAllowance)
      ? true
      : false;

  const needApproveActionAmount = needApproveAction
    ? originalStake.stakedLP.add((change as any).stakeLP)
    : Decimal.ZERO;

  return (
    <LpStakingEditor title={"UNI LP Staking"} {...{ originalStake, editedUniLp, dispatch }}>
      {description ??
        (makingNewStake ? (
          <ActionDescription>Enter the amount of {LP} you'd like to stake.</ActionDescription>
        ) : (
          <ActionDescription>Adjust the {LP} amount to stake or withdraw.</ActionDescription>
        ))}

      <Flex variant="layout.actions">
        <Button
          variant="cancel"
          onClick={() => dispatchStakingViewAction({ type: "cancelAdjusting" })}
        >
          Cancel
        </Button>

        {validChange ? (
          <StakingManagerAction
            change={validChange}
            needApproveAction={needApproveAction}
            needApproveActionAmount={needApproveActionAmount}
          >
            {needApproveAction ? "Approve" : "Confirm"}
          </StakingManagerAction>
        ) : (
          <Button disabled>Confirm</Button>
        )}
      </Flex>
    </LpStakingEditor>
  );
};
