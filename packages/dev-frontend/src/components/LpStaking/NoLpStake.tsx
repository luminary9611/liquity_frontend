import { Card, Heading, Box, Flex, Button } from "theme-ui";

import { LP } from "../../strings";

import { InfoMessage } from "../InfoMessage";
import { useLpStakingView } from "./context/LpStakingViewContext";

export const NoLpStake: React.FC = () => {
  const { dispatch } = useLpStakingView();

  return (
    <Card>
      <Heading>Uni Lp Staking</Heading>
      <Box sx={{ p: [2, 3] }}>
        <InfoMessage title={`You haven't staked ${LP} yet.`}>
          Stake {LP} to earn Lqty rewards.
        </InfoMessage>

        <Flex variant="layout.actions">
          <Button onClick={() => dispatch({ type: "startAdjusting" })}>Start staking Uni LP</Button>
        </Flex>
      </Box>
    </Card>
  );
};
