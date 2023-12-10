import React, { useState } from "react";
import { Heading, Box, Card, Button } from "theme-ui";

import { Decimal, Decimalish, Difference, LiquityStoreState, LPStake } from "@liquity/lib-base";
import { useLiquitySelector } from "@liquity/lib-react";

import { GT, LP } from "../../strings";

import { Icon } from "../Icon";
import { EditableRow, StaticRow } from "../Trove/Editor";
import { LoadingOverlay } from "../LoadingOverlay";

import { useLpStakingView } from "./context/LpStakingViewContext";

const select = ({ uniTokenBalance, totalStakedUniTokens }: LiquityStoreState) => ({
  uniTokenBalance,
  totalStakedUniTokens
});

type LpStakingEditorProps = {
  title: string;
  originalStake: LPStake;
  editedUniLp: Decimal;
  dispatch: (action: { type: "setStake"; newValue: Decimalish } | { type: "revert" }) => void;
};

export const LpStakingEditor: React.FC<LpStakingEditorProps> = ({
  children,
  title,
  originalStake,
  editedUniLp,
  dispatch
}) => {
  const { uniTokenBalance, totalStakedUniTokens } = useLiquitySelector(select);
  const { changePending } = useLpStakingView();
  const editingState = useState<string>();

  const edited = !editedUniLp.eq(originalStake.stakedLP);

  const maxAmount = originalStake.stakedLP.add(uniTokenBalance);
  const maxedOut = editedUniLp.eq(maxAmount);

  // const totalStakedLQTYAfterChange = totalStakedUniTokens.sub(originalStake.stakedLP).add(editedUniLp);

  // const originalPoolShare = originalStake.stakedLP.mulDiv(100, totalStakedUniTokens);
  // const newPoolShare = editedUniLp.mulDiv(100, totalStakedLQTYAfterChange);
  // const poolShareChange =
  //   originalStake.stakedLP.nonZero && Difference.between(newPoolShare, originalPoolShare).nonZero;

  return (
    <Card>
      <Heading>
        {title}
        {edited && !changePending && (
          <Button
            variant="titleIcon"
            sx={{ ":enabled:hover": { color: "danger" } }}
            onClick={() => dispatch({ type: "revert" })}
          >
            <Icon name="history" size="lg" />
          </Button>
        )}
      </Heading>

      <Box sx={{ p: [2, 3] }}>
        <EditableRow
          label="Stake"
          inputId="stake-lqty"
          amount={editedUniLp.prettify()}
          maxAmount={maxAmount.toString()}
          maxedOut={maxedOut}
          unit={LP}
          {...{ editingState }}
          editedAmount={editedUniLp.toString(2)}
          setEditedAmount={newValue => dispatch({ type: "setStake", newValue })}
        />

        {/* {newPoolShare.infinite ? (
          <StaticRow label="Pool share" inputId="stake-share" amount="N/A" />
        ) : (
          <StaticRow
            label="Pool share"
            inputId="stake-share"
            amount={newPoolShare.prettify(4)}
            pendingAmount={poolShareChange?.prettify(4).concat("%")}
            pendingColor={poolShareChange?.positive ? "success" : "danger"}
            unit="%"
          />
        )} */}

        {!originalStake.isEmpty && (
          <>
            <StaticRow
              label="Issuance gain"
              inputId="stake-gain-lusd"
              amount={originalStake.lqtyReward.prettify()}
              color={originalStake.lqtyReward.nonZero && "success"}
              unit={GT}
            />
          </>
        )}

        {children}
      </Box>

      {changePending && <LoadingOverlay />}
    </Card>
  );
};
