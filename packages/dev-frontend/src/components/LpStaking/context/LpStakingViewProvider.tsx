import { useEffect } from "react";

// import { LiquityStoreState, LQTYStake } from "@liquity/lib-base";
import { LiquityStoreState, LPStake } from "@liquity/lib-base";
import { LiquityStoreUpdate, useLiquityReducer } from "@liquity/lib-react";
import { Decimal } from "@liquity/lib-base";
import { useMyTransactionState } from "../../Transaction";

import { LpStakingViewAction, StakingViewContext } from "./LpStakingViewContext";

type LpStakingViewProviderAction =
  | LiquityStoreUpdate
  | LpStakingViewAction
  | { type: "startChange" | "abortChange" };

type LpStakingViewProviderState = {
  lpStake: LPStake;
  uniTokenBalance: Decimal;
  uniTokenAllowance: Decimal;
  totalStakedUniTokens: Decimal;
  lqtyBalance: Decimal;
  changePending: boolean;
  adjusting: boolean;
};

const init = ({
  uniTokenBalance,
  uniTokenAllowance,
  totalStakedUniTokens,
  liquidityMiningLQTYReward,
  liquidityMiningStake,
  lqtyBalance
}: LiquityStoreState): LpStakingViewProviderState => ({
  lpStake: new LPStake(liquidityMiningStake, liquidityMiningLQTYReward),
  lqtyBalance,
  uniTokenBalance,
  uniTokenAllowance,
  totalStakedUniTokens,
  changePending: false,
  adjusting: false
});

const reduce = (
  state: LpStakingViewProviderState,
  action: LpStakingViewProviderAction
): LpStakingViewProviderState => {
  switch (action.type) {
    case "startAdjusting":
      return { ...state, adjusting: true };

    case "cancelAdjusting":
      return { ...state, adjusting: false };

    case "startChange":
      return { ...state, changePending: true };

    case "abortChange":
      return { ...state, changePending: false };

    case "updateStore": {
      const {
        oldState: {
          uniTokenBalance: olduniTokenBalance,
          uniTokenAllowance: olduniTokenAllowance,
          liquidityMiningStake: oldliquidityMiningStake,
          liquidityMiningLQTYReward: oldliquidityMiningLQTYReward
        },
        stateChange: {
          uniTokenBalance: updateuniTokenBalance,
          uniTokenAllowance: updateuniTokenAllowance,
          liquidityMiningStake: updateliquidityMiningStake,
          liquidityMiningLQTYReward: updateliquidityMiningLQTYReward
        }
      } = action;

      if (updateliquidityMiningStake && updateuniTokenBalance) {
        const changeCommitted =
          !updateliquidityMiningStake.eq(oldliquidityMiningStake) ||
          !updateuniTokenBalance.eq(olduniTokenBalance);

        return {
          ...state,
          lpStake: new LPStake(
            updateliquidityMiningStake,
            updateliquidityMiningLQTYReward || oldliquidityMiningLQTYReward
          ),
          adjusting: false,
          changePending: changeCommitted ? false : state.changePending
        };
      }

      if (updateuniTokenAllowance) {
        const changeCommitted = updateuniTokenAllowance.gt(olduniTokenAllowance);
        return {
          ...state,
          changePending: changeCommitted ? false : state.changePending
        };
      }

      if (updateliquidityMiningLQTYReward) {
        const changeCommitted = updateliquidityMiningLQTYReward.lt(oldliquidityMiningLQTYReward);
        return {
          ...state,
          lpStake: new LPStake(
            updateliquidityMiningStake || oldliquidityMiningStake,
            updateliquidityMiningLQTYReward
          ),
          changePending: changeCommitted ? false : state.changePending
        };
      }
    }
  }

  return state;
};

export const LpStakingViewProvider: React.FC = ({ children }) => {
  const stakingTransactionState = useMyTransactionState("lpstake");
  const [{ adjusting, changePending, lpStake }, dispatch] = useLiquityReducer(reduce, init);

  useEffect(() => {
    if (
      stakingTransactionState.type === "waitingForApproval" ||
      stakingTransactionState.type === "waitingForConfirmation"
    ) {
      dispatch({ type: "startChange" });
    } else if (
      stakingTransactionState.type === "failed" ||
      stakingTransactionState.type === "cancelled"
    ) {
      dispatch({ type: "abortChange" });
    }
  }, [stakingTransactionState.type, dispatch]);

  return (
    <StakingViewContext.Provider
      value={{
        view: adjusting ? "ADJUSTING" : lpStake.isEmpty ? "NONE" : "ACTIVE",
        changePending,
        dispatch
      }}
    >
      {children}
    </StakingViewContext.Provider>
  );
};
