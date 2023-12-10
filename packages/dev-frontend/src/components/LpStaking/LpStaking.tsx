import { useLpStakingView } from "./context/LpStakingViewContext";
import { ReadOnlyLpStake } from "./ReadOnlyLpStake";
import { LpStakingManager } from "./LpStakingManager";
import { NoLpStake } from "./NoLpStake";

export const LpStaking: React.FC = () => {
  const { view } = useLpStakingView();

  switch (view) {
    case "ACTIVE":
      return <ReadOnlyLpStake />;

    case "ADJUSTING":
      return <LpStakingManager />;

    case "NONE":
      return <NoLpStake />;
  }
};
