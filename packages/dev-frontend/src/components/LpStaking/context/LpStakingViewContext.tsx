import { createContext, useContext } from "react";

export type LpStakingView = "ACTIVE" | "ADJUSTING" | "NONE";

export type LpStakingViewAction = { type: "startAdjusting" | "cancelAdjusting" };

export type LpStakingViewContextType = {
  view: LpStakingView;

  // Indicates that a staking TX is pending.
  // The panel should be covered with a spinner overlay when this is true.
  changePending: boolean;

  // Dispatch an action that changes the Staking panel's view.
  dispatch: (action: LpStakingViewAction) => void;
};

export const StakingViewContext = createContext<LpStakingViewContextType | null>(null);

export const useLpStakingView = (): LpStakingViewContextType => {
  const context = useContext(StakingViewContext);

  if (context === null) {
    throw new Error("You must add a <TroveViewProvider> into the React tree");
  }

  return context;
};
