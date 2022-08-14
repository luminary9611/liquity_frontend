import React from "react";
import { Card, Heading, Link, Box, Text, Button } from "theme-ui";
import { AddressZero } from "@ethersproject/constants";
import { Decimal, Percent, LiquityStoreState } from "@liquity/lib-base";
import { useLiquitySelector } from "@liquity/lib-react";

import { useLiquity } from "../hooks/LiquityContext";
import { COIN, GT } from "../strings";
import { Statistic } from "./Statistic";

const selectBalances = ({ accountBalance, lusdBalance, lqtyBalance }: LiquityStoreState) => ({
  accountBalance,
  lusdBalance,
  lqtyBalance
});

const Balances: React.FC = () => {
  const { accountBalance, lusdBalance, lqtyBalance } = useLiquitySelector(selectBalances);

  return (
    <Box sx={{ mb: 3 }}>
      <Heading>My Account Balances</Heading>
      <Statistic name="ETH"> {accountBalance.prettify(4)}</Statistic>
      <Statistic name={COIN}> {lusdBalance.prettify()}</Statistic>
      <Statistic name={GT}>{lqtyBalance.prettify()}</Statistic>
    </Box>
  );
};

const GitHubCommit: React.FC<{ children?: string }> = ({ children }) =>
  children?.match(/[0-9a-f]{40}/) ? (
    <Link href={`https://github.com/chmllr/liquity-fe/commit/${children}`}>{children.substr(0, 7)}</Link>
  ) : (
    <>unknown</>
  );

type SystemStatsProps = {
  variant?: string;
  showBalances?: boolean;
};

const select = ({
  numberOfTroves,
  price,
  total,
  lusdInStabilityPool,
  borrowingRate,
  redemptionRate,
  totalStakedLQTY,
  frontend
}: LiquityStoreState) => ({
  numberOfTroves,
  price,
  total,
  lusdInStabilityPool,
  borrowingRate,
  redemptionRate,
  totalStakedLQTY,
  kickbackRate: frontend.status === "registered" ? frontend.kickbackRate : null
});

export const SystemStats: React.FC<SystemStatsProps> = ({ variant = "info", showBalances }) => {
  const {
    liquity: {
      connection: { version: contractsVersion, deploymentDate, frontendTag }
    }
  } = useLiquity();

  const {
    numberOfTroves,
    price,
    lusdInStabilityPool,
    total,
    borrowingRate,
    totalStakedLQTY,
    kickbackRate
  } = useLiquitySelector(select);

  const lusdInStabilityPoolPct =
    total.debt.nonZero && new Percent(lusdInStabilityPool.div(total.debt));
  const totalCollateralRatioPct = new Percent(total.collateralRatio(price));
  const borrowingFeePct = new Percent(borrowingRate);
  const kickbackRatePct = frontendTag === AddressZero ? "100" : kickbackRate?.mul(100).prettify();

  const featuresVisibilityKey = "feature-visibility";
  const [changed, setChanged] = React.useState(false);
  const [feature, setFeature] = React.useState(JSON.parse(
    localStorage.getItem(featuresVisibilityKey) ||
      JSON.stringify({"bonds": true, "trove": true, "sp": true, "staking": true }))
  );
  const toggleFeature = (key:string) => {
    feature[key] = !feature[key];
    setFeature({...feature});
    localStorage.setItem(featuresVisibilityKey, JSON.stringify(feature));
    setChanged(true);
  };

  return (
    <Card {...{ variant }}>
      {showBalances && <Balances />}

      <Heading>Liquity statistics</Heading>

      <Heading as="h2" sx={{ mt: 3, fontWeight: "body" }}>
        Protocol
      </Heading>

      <Statistic
        name="Borrowing Fee"
        tooltip="The Borrowing Fee is a one-off fee charged as a percentage of the borrowed amount (in LUSD) and is part of a Trove's debt. The fee varies between 0.5% and 5% depending on LUSD redemption volumes."
      >
        {borrowingFeePct.toString(2)}
      </Statistic>

      <Statistic
        name="TVL"
        tooltip="The Total Value Locked (TVL) is the total value of Ether locked as collateral in the system, given in ETH and USD."
      >
        {total.collateral.shorten()} <Text sx={{ fontSize: 1 }}>&nbsp;ETH</Text>
        <Text sx={{ fontSize: 1 }}>
          &nbsp;(${Decimal.from(total.collateral.mul(price)).shorten()})
        </Text>
      </Statistic>
      <Statistic name="Troves" tooltip="The total number of active Troves in the system.">
        {Decimal.from(numberOfTroves).prettify(0)}
      </Statistic>
      <Statistic name="LUSD supply" tooltip="The total LUSD minted by the Liquity Protocol.">
        {total.debt.shorten()}
      </Statistic>
      {lusdInStabilityPoolPct && (
        <Statistic
          name="LUSD in Stability Pool"
          tooltip="The total LUSD currently held in the Stability Pool, expressed as an amount and a fraction of the LUSD supply.
        "
        >
          {lusdInStabilityPool.shorten()}
          <Text sx={{ fontSize: 1 }}>&nbsp;({lusdInStabilityPoolPct.toString(1)})</Text>
        </Statistic>
      )}
      <Statistic
        name="Staked LQTY"
        tooltip="The total amount of LQTY that is staked for earning fee revenue."
      >
        {totalStakedLQTY.shorten()}
      </Statistic>
      <Statistic
        name="Total Collateral Ratio"
        tooltip="The ratio of the Dollar value of the entire system collateral at the current ETH:USD price, to the entire system debt."
      >
        {totalCollateralRatioPct.prettify()}
      </Statistic>
      <Statistic
        name="Recovery Mode"
        tooltip="Recovery Mode is activated when the Total Collateral Ratio (TCR) falls below 150%. When active, your Trove can be liquidated if its collateral ratio is below the TCR. The maximum collateral you can lose from liquidation is capped at 110% of your Trove's debt. Operations are also restricted that would negatively impact the TCR."
      >
        {total.collateralRatioIsBelowCritical(price) ? <Box color="danger">Yes</Box> : "No"}
      </Statistic>
      {}

      <Heading as="h2" sx={{ mt: 3, fontWeight: "body" }}>
        Frontend
      </Heading>
      {kickbackRatePct && (
        <Statistic
          name="Kickback Rate"
          tooltip="A rate between 0 and 100% set by the Frontend Operator that determines the fraction of LQTY that will be paid out as a kickback to the Stability Providers using the frontend."
        >
          {kickbackRatePct}%
        </Statistic>
      )}

      <br />
      <Box sx={{ fontSize: 0 }}>
          <input type="checkbox" defaultChecked={feature["bonds"]} onChange={() => toggleFeature("bonds")} />Bonds &nbsp;
          <input type="checkbox" defaultChecked={feature["trove"]} onChange={() => toggleFeature("trove")} />Trove &nbsp;
          <input type="checkbox" defaultChecked={feature["sp"]} onChange={() => toggleFeature("sp")} />Stability Pool &nbsp;
          <input type="checkbox" defaultChecked={feature["staking"]} onChange={() => toggleFeature("staking")} />Staking &nbsp;
          {changed && <Box sx={{marginTop: "1em"}}>
              <Button variant="primary" onClick={() => window.location.reload()}>Save & reload</Button>
          </Box>}
      </Box>

      <Box sx={{ mt: 3, opacity: 0.66 }}>
        <Box sx={{ fontSize: 0 }}>
          Contracts version: <GitHubCommit>{contractsVersion}</GitHubCommit>
        </Box>
        <Box sx={{ fontSize: 0 }}>Deployed: {deploymentDate.toLocaleString()}</Box>
        <Box sx={{ fontSize: 0 }}>
          Frontend version:{" "}
          {process.env.NODE_ENV === "development" ? (
            "development"
          ) : (
            <GitHubCommit>{process.env.REACT_APP_VERSION}</GitHubCommit>
          )}
        </Box>
        <Box sx={{ fontSize: 0 }}>IC canister: <Link href="https://dashboard.internetcomputer.org/canister/vfu7d-vyaaa-aaaap-aajiq-cai">vfu7d-vyaaa-aaaap-aajiq-cai</Link></Box>
        <Box sx={{ fontSize: 0 }}>Updates & contact: <Link href="https://taggr.top/#/journal/imtbl">imtbl@TAGGR</Link></Box>
      </Box>
      <br />
      <Box>
            <Link href="https://internetcomputer.org">
                <svg width="228" height="49" viewBox="0 0 228 49" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="0.5" y="0.5" width="227" height="48" rx="3.5" stroke="url(#paint0_linear_1731_62)"/>
                <path d="M51.3701 12C48.4632 12 45.2944 13.5165 41.9451 16.5037C40.3562 17.9191 38.984 19.4357 37.9548 20.6489C37.9548 20.6489 37.9548 20.6489 37.9639 20.6581V20.6489C37.9639 20.6489 39.5889 22.4504 41.3854 24.3805C42.3514 23.2133 43.7416 21.6232 45.3395 20.1894C48.3187 17.5331 50.2597 16.9724 51.3701 16.9724C55.55 16.9724 58.9444 20.3456 58.9444 24.4908C58.9444 28.6085 55.5409 31.9816 51.3701 32.0092C51.1805 32.0092 50.9368 31.9816 50.6298 31.9173C51.8486 32.4504 53.1576 32.8364 54.4034 32.8364C62.059 32.8364 63.5576 27.7537 63.6569 27.3861C63.8826 26.4577 63.9999 25.4835 63.9999 24.4816C63.9999 17.6066 58.3305 12 51.3701 12Z" fill="url(#paint1_linear_1731_62)"/>
                <path d="M24.6298 36.9999C27.5368 36.9999 30.7055 35.4834 34.0548 32.4962C35.6437 31.0808 37.0159 29.5642 38.0451 28.351C38.0451 28.351 38.0451 28.351 38.0361 28.3418V28.351C38.0361 28.351 36.4111 26.5495 34.6145 24.6194C33.6486 25.7867 32.2583 27.3767 30.6604 28.8106C27.6812 31.4668 25.7403 32.0275 24.6298 32.0275C20.45 32.0183 17.0555 28.6451 17.0555 24.4999C17.0555 20.3822 20.459 17.0091 24.6298 16.9815C24.8194 16.9815 25.0632 17.0091 25.3701 17.0734C24.1514 16.5403 22.8423 16.1543 21.5965 16.1543C13.941 16.1543 12.4514 21.237 12.3431 21.5955C12.1174 22.533 12 23.4981 12 24.4999C12 31.3933 17.6694 36.9999 24.6298 36.9999Z" fill="url(#paint2_linear_1731_62)"/>
                <path d="M54.3856 32.7261C50.4675 32.625 46.396 29.4816 45.5654 28.7004C43.4168 26.6783 38.4606 21.2096 38.0724 20.7776C34.4432 16.6324 29.5231 12 24.63 12H24.621H24.612C18.6717 12.0276 13.6794 16.1268 12.3433 21.5956C12.4426 21.2371 14.4016 16.0533 21.5877 16.2371C25.5057 16.3382 29.5953 19.5276 30.4349 20.3088C32.5835 22.3309 37.5398 27.7997 37.9279 28.2316C41.5571 32.3677 46.4772 37 51.3703 37H51.3793H51.3883C57.3286 36.9725 62.33 32.8732 63.6571 27.4044C63.5487 27.7629 61.5807 32.9008 54.3856 32.7261Z" fill="#29ABE2"/>
                <path d="M73.0301 33.827C73.3063 33.827 73.5301 33.6032 73.5301 33.327V26.6622C73.5301 26.386 73.3063 26.1622 73.0301 26.1622H72.5C72.2239 26.1622 72 26.386 72 26.6622V33.327C72 33.6032 72.2239 33.827 72.5 33.827H73.0301Z" fill="white"/>
                <path d="M83.2018 33.827C83.478 33.827 83.7018 33.6032 83.7018 33.327V26.6622C83.7018 26.386 83.478 26.1622 83.2018 26.1622H82.6936C82.4174 26.1622 82.1936 26.386 82.1936 26.6622V31.2324L79.264 26.6256C79.0805 26.337 78.7622 26.1622 78.4202 26.1622H77.5895C77.3133 26.1622 77.0895 26.386 77.0895 26.6622V33.327C77.0895 33.6032 77.3133 33.827 77.5895 33.827H78.0978C78.3739 33.827 78.5978 33.6032 78.5978 33.327V28.3892L81.9693 33.5987C82.0614 33.7411 82.2195 33.827 82.389 33.827H83.2018Z" fill="white"/>
                <path d="M92.4535 27.5784C92.7297 27.5784 92.9535 27.3545 92.9535 27.0784V26.6622C92.9535 26.386 92.7297 26.1622 92.4535 26.1622H87.0379C86.7617 26.1622 86.5379 26.386 86.5379 26.6622V27.0784C86.5379 27.3545 86.7617 27.5784 87.0379 27.5784H88.9861V33.327C88.9861 33.6032 89.21 33.827 89.4861 33.827H90.0053C90.2814 33.827 90.5053 33.6032 90.5053 33.327V27.5784H92.4535Z" fill="white"/>
                <path d="M100.138 33.827C100.415 33.827 100.638 33.6032 100.638 33.327V32.9216C100.638 32.6455 100.415 32.4216 100.138 32.4216H97.2941V30.6486H99.8215C100.098 30.6486 100.322 30.4248 100.322 30.1486V29.8189C100.322 29.5428 100.098 29.3189 99.8215 29.3189H97.2941V27.5676H100.138C100.415 27.5676 100.638 27.3437 100.638 27.0676V26.6622C100.638 26.386 100.415 26.1622 100.138 26.1622H96.2858C96.0096 26.1622 95.7858 26.386 95.7858 26.6622V33.327C95.7858 33.6032 96.0096 33.827 96.2858 33.827H100.138Z" fill="white"/>
                <path d="M107.55 33.5559C107.635 33.7224 107.807 33.827 107.994 33.827H108.541C108.918 33.827 109.16 33.4259 108.983 33.0929L107.711 30.6919C108.727 30.4 109.361 29.5892 109.361 28.5189C109.361 27.1892 108.4 26.1622 106.891 26.1622H104.364C104.088 26.1622 103.864 26.386 103.864 26.6622V33.327C103.864 33.6032 104.088 33.827 104.364 33.827H104.883C105.159 33.827 105.383 33.6032 105.383 33.327V30.8757H106.17L107.55 33.5559ZM105.383 29.5892V27.4595H106.607C107.372 27.4595 107.82 27.8811 107.82 28.5297C107.82 29.1568 107.372 29.5892 106.607 29.5892H105.383Z" fill="white"/>
                <path d="M118.609 33.827C118.885 33.827 119.109 33.6032 119.109 33.327V26.6622C119.109 26.386 118.885 26.1622 118.609 26.1622H118.101C117.825 26.1622 117.601 26.386 117.601 26.6622V31.2324L114.671 26.6256C114.488 26.337 114.17 26.1622 113.828 26.1622H112.997C112.721 26.1622 112.497 26.386 112.497 26.6622V33.327C112.497 33.6032 112.721 33.827 112.997 33.827H113.505C113.781 33.827 114.005 33.6032 114.005 33.327V28.3892L117.377 33.5987C117.469 33.7411 117.627 33.827 117.796 33.827H118.609Z" fill="white"/>
                <path d="M127.03 33.827C127.306 33.827 127.53 33.6032 127.53 33.327V32.9216C127.53 32.6455 127.306 32.4216 127.03 32.4216H124.186V30.6486H126.713C126.989 30.6486 127.213 30.4248 127.213 30.1486V29.8189C127.213 29.5428 126.989 29.3189 126.713 29.3189H124.186V27.5676H127.03C127.306 27.5676 127.53 27.3437 127.53 27.0676V26.6622C127.53 26.386 127.306 26.1622 127.03 26.1622H123.178C122.901 26.1622 122.678 26.386 122.678 26.6622V33.327C122.678 33.6032 122.901 33.827 123.178 33.827H127.03Z" fill="white"/>
                <path d="M135.939 27.5784C136.215 27.5784 136.439 27.3545 136.439 27.0784V26.6622C136.439 26.386 136.215 26.1622 135.939 26.1622H130.523C130.247 26.1622 130.023 26.386 130.023 26.6622V27.0784C130.023 27.3545 130.247 27.5784 130.523 27.5784H132.471V33.327C132.471 33.6032 132.695 33.827 132.971 33.827H133.491C133.767 33.827 133.991 33.6032 133.991 33.327V27.5784H135.939Z" fill="white"/>
                <path d="M146.823 33.9892C148.998 33.9892 150.113 32.5622 150.408 31.3838L148.998 30.9622C148.79 31.6757 148.146 32.5297 146.823 32.5297C145.577 32.5297 144.419 31.6324 144.419 30C144.419 28.2595 145.643 27.4378 146.801 27.4378C148.146 27.4378 148.747 28.2486 148.932 28.9838L150.353 28.5405C150.047 27.2973 148.943 26 146.801 26C144.725 26 142.856 27.5568 142.856 30C142.856 32.4432 144.659 33.9892 146.823 33.9892Z" fill="white"/>
                <path d="M154.428 29.9892C154.428 28.2595 155.653 27.4378 156.844 27.4378C158.046 27.4378 159.27 28.2595 159.27 29.9892C159.27 31.7189 158.046 32.5405 156.844 32.5405C155.653 32.5405 154.428 31.7189 154.428 29.9892ZM152.866 30C152.866 32.4649 154.745 33.9892 156.844 33.9892C158.953 33.9892 160.833 32.4649 160.833 30C160.833 27.5243 158.953 26 156.844 26C154.745 26 152.866 27.5243 152.866 30Z" fill="white"/>
                <path d="M172.077 33.827C172.354 33.827 172.577 33.6032 172.577 33.327V26.6622C172.577 26.386 172.354 26.1622 172.077 26.1622H170.858C170.655 26.1622 170.472 26.2846 170.395 26.4722L168.249 31.6973L166.05 26.4683C165.972 26.2828 165.79 26.1622 165.589 26.1622H164.432C164.156 26.1622 163.932 26.386 163.932 26.6622V33.327C163.932 33.6032 164.156 33.827 164.432 33.827H164.875C165.151 33.827 165.375 33.6032 165.375 33.327V28.4973L167.476 33.52C167.554 33.706 167.736 33.827 167.937 33.827H168.528C168.73 33.827 168.912 33.7053 168.989 33.5187L171.091 28.4541V33.327C171.091 33.6032 171.315 33.827 171.591 33.827H172.077Z" fill="white"/>
                <path d="M177.66 29.6541V27.4595H178.851C179.605 27.4595 180.064 27.8811 180.064 28.5622C180.064 29.2216 179.605 29.6541 178.851 29.6541H177.66ZM179.037 30.9405C180.567 30.9405 181.584 29.9459 181.584 28.5514C181.584 27.1676 180.567 26.1622 179.037 26.1622H176.641C176.365 26.1622 176.141 26.386 176.141 26.6622V33.327C176.141 33.6032 176.365 33.827 176.641 33.827H177.149C177.425 33.827 177.649 33.6032 177.649 33.327V30.9405H179.037Z" fill="white"/>
                <path d="M187.414 34C189.076 34 190.398 32.9946 190.398 31.1135V26.6622C190.398 26.386 190.174 26.1622 189.898 26.1622H189.39C189.114 26.1622 188.89 26.386 188.89 26.6622V31.0054C188.89 32.0108 188.332 32.5405 187.414 32.5405C186.518 32.5405 185.95 32.0108 185.95 31.0054V26.6622C185.95 26.386 185.726 26.1622 185.45 26.1622H184.941C184.665 26.1622 184.441 26.386 184.441 26.6622V31.1135C184.441 32.9946 185.764 34 187.414 34Z" fill="white"/>
                <path d="M199.081 27.5784C199.357 27.5784 199.581 27.3545 199.581 27.0784V26.6622C199.581 26.386 199.357 26.1622 199.081 26.1622H193.666C193.389 26.1622 193.166 26.386 193.166 26.6622V27.0784C193.166 27.3545 193.389 27.5784 193.666 27.5784H195.614V33.327C195.614 33.6032 195.838 33.827 196.114 33.827H196.633C196.909 33.827 197.133 33.6032 197.133 33.327V27.5784H199.081Z" fill="white"/>
                <path d="M206.766 33.827C207.042 33.827 207.266 33.6032 207.266 33.327V32.9216C207.266 32.6455 207.042 32.4216 206.766 32.4216H203.922V30.6486H206.449C206.725 30.6486 206.949 30.4248 206.949 30.1486V29.8189C206.949 29.5428 206.725 29.3189 206.449 29.3189H203.922V27.5676H206.766C207.042 27.5676 207.266 27.3437 207.266 27.0676V26.6622C207.266 26.386 207.042 26.1622 206.766 26.1622H202.913C202.637 26.1622 202.413 26.386 202.413 26.6622V33.327C202.413 33.6032 202.637 33.827 202.913 33.827H206.766Z" fill="white"/>
                <path d="M214.177 33.5559C214.263 33.7224 214.435 33.827 214.622 33.827H215.169C215.546 33.827 215.787 33.4259 215.611 33.0929L214.339 30.6919C215.355 30.4 215.989 29.5892 215.989 28.5189C215.989 27.1892 215.027 26.1622 213.519 26.1622H210.492V33.327C210.492 33.6032 210.715 33.827 210.992 33.827H211.511C211.787 33.827 212.011 33.6032 212.011 33.327V30.8757H212.798L214.177 33.5559ZM212.011 29.5892V27.4595H213.235C214 27.4595 214.448 27.8811 214.448 28.5297C214.448 29.1568 214 29.5892 213.235 29.5892H212.011Z" fill="white"/>
                <path d="M73.002 16.941V14.026H74.652C75.653 14.026 76.269 14.609 76.269 15.5C76.269 16.358 75.653 16.941 74.652 16.941H73.002ZM74.795 17.766C76.236 17.766 77.193 16.798 77.193 15.489C77.193 14.191 76.236 13.201 74.795 13.201H72.078V21H73.002V17.766H74.795ZM80.301 15.577C78.783 15.577 77.661 16.743 77.661 18.36C77.661 19.988 78.783 21.154 80.301 21.154C81.819 21.154 82.941 19.988 82.941 18.36C82.941 16.743 81.819 15.577 80.301 15.577ZM80.301 16.369C81.247 16.369 82.061 17.084 82.061 18.36C82.061 19.647 81.247 20.362 80.301 20.362C79.355 20.362 78.541 19.647 78.541 18.36C78.541 17.084 79.355 16.369 80.301 16.369ZM87.3143 15.731L85.8623 19.9L84.5753 15.731H83.6293L85.3783 21H86.3133L87.7653 16.798L89.2393 21H90.1633L91.8793 15.731H90.9443L89.6903 19.9L88.2273 15.731H87.3143ZM93.4952 17.854C93.5502 17.073 94.1662 16.358 95.0792 16.358C96.0802 16.358 96.6192 17.018 96.6412 17.854H93.4952ZM96.7622 19.229C96.5532 19.856 96.0692 20.362 95.1782 20.362C94.2322 20.362 93.4732 19.647 93.4732 18.646V18.602H97.5322C97.5432 18.525 97.5542 18.404 97.5542 18.294C97.5542 16.688 96.6632 15.577 95.0682 15.577C93.7372 15.577 92.5712 16.688 92.5712 18.349C92.5712 20.12 93.7702 21.154 95.1782 21.154C96.3992 21.154 97.2242 20.417 97.5212 19.504L96.7622 19.229ZM101.712 15.698C101.635 15.676 101.481 15.654 101.338 15.654C100.755 15.654 100.084 15.907 99.7433 16.677V15.731H98.8853V21H99.7653V18.272C99.7653 17.084 100.37 16.578 101.25 16.578C101.404 16.578 101.569 16.589 101.712 16.633V15.698ZM103.195 17.854C103.25 17.073 103.866 16.358 104.779 16.358C105.78 16.358 106.319 17.018 106.341 17.854H103.195ZM106.462 19.229C106.253 19.856 105.769 20.362 104.878 20.362C103.932 20.362 103.173 19.647 103.173 18.646V18.602H107.232C107.243 18.525 107.254 18.404 107.254 18.294C107.254 16.688 106.363 15.577 104.768 15.577C103.437 15.577 102.271 16.688 102.271 18.349C102.271 20.12 103.47 21.154 104.878 21.154C106.099 21.154 106.924 20.417 107.221 19.504L106.462 19.229ZM112.403 20.241C112.403 20.582 112.436 20.879 112.458 21H113.316C113.294 20.89 113.261 20.538 113.261 20.01V13.047H112.381V16.578C112.205 16.138 111.688 15.577 110.676 15.577C109.202 15.577 108.234 16.831 108.234 18.36C108.234 19.922 109.158 21.154 110.676 21.154C111.589 21.154 112.161 20.615 112.403 20.098V20.241ZM110.753 20.362C109.763 20.362 109.114 19.526 109.114 18.36C109.114 17.194 109.752 16.369 110.753 16.369C111.754 16.369 112.403 17.194 112.403 18.36C112.403 19.526 111.743 20.362 110.753 20.362ZM118.639 21V20.131C118.947 20.703 119.563 21.154 120.443 21.154C121.972 21.154 122.863 19.933 122.863 18.36C122.863 16.82 122.027 15.577 120.465 15.577C119.519 15.577 118.903 16.094 118.661 16.589V13.047H117.781V21H118.639ZM120.311 20.362C119.299 20.362 118.639 19.526 118.639 18.36C118.639 17.194 119.288 16.369 120.311 16.369C121.334 16.369 121.983 17.194 121.983 18.36C121.983 19.526 121.323 20.362 120.311 20.362ZM125.364 23.09L128.741 15.731H127.784L126.145 19.46L124.407 15.731H123.395L125.661 20.373L124.385 23.09H125.364ZM134.548 16.369C135.494 16.369 135.923 17.018 136.066 17.579L136.858 17.238C136.638 16.402 135.901 15.577 134.548 15.577C133.063 15.577 131.941 16.721 131.941 18.36C131.941 19.966 133.041 21.154 134.559 21.154C135.912 21.154 136.649 20.296 136.902 19.515L136.132 19.174C135.978 19.658 135.56 20.362 134.559 20.362C133.624 20.362 132.821 19.625 132.821 18.36C132.821 17.084 133.624 16.369 134.548 16.369ZM140.986 15.698C140.909 15.676 140.755 15.654 140.612 15.654C140.029 15.654 139.358 15.907 139.017 16.677V15.731H138.159V21H139.039V18.272C139.039 17.084 139.644 16.578 140.524 16.578C140.678 16.578 140.843 16.589 140.986 16.633V15.698ZM143.368 23.09L146.745 15.731H145.788L144.149 19.46L142.411 15.731H141.399L143.665 20.373L142.389 23.09H143.368ZM148.664 23.09V20.186C148.939 20.681 149.544 21.154 150.446 21.154C151.964 21.154 152.866 19.933 152.866 18.36C152.866 16.787 152.019 15.577 150.468 15.577C149.533 15.577 148.917 16.072 148.642 16.611V15.731H147.784V23.09H148.664ZM150.314 20.362C149.302 20.362 148.642 19.526 148.642 18.36C148.642 17.194 149.291 16.369 150.314 16.369C151.337 16.369 151.986 17.194 151.986 18.36C151.986 19.526 151.326 20.362 150.314 20.362ZM155.419 14.059H154.594V14.928C154.594 15.423 154.363 15.731 153.824 15.731H153.483V16.523H154.539V19.559C154.539 20.516 155.1 21.055 155.969 21.055C156.31 21.055 156.563 20.989 156.662 20.956V20.208C156.574 20.23 156.376 20.263 156.222 20.263C155.661 20.263 155.419 19.988 155.419 19.438V16.523H156.662V15.731H155.419V14.059ZM160.148 15.577C158.63 15.577 157.508 16.743 157.508 18.36C157.508 19.988 158.63 21.154 160.148 21.154C161.666 21.154 162.788 19.988 162.788 18.36C162.788 16.743 161.666 15.577 160.148 15.577ZM160.148 16.369C161.094 16.369 161.908 17.084 161.908 18.36C161.908 19.647 161.094 20.362 160.148 20.362C159.202 20.362 158.388 19.647 158.388 18.36C158.388 17.084 159.202 16.369 160.148 16.369Z" fill="white"/>
                <defs>
                <linearGradient id="paint0_linear_1731_62" x1="32.6912" y1="7.02574" x2="46.9757" y2="73.4926" gradientUnits="userSpaceOnUse">
                <stop stopColor="#A1A2A7"/>
                <stop offset="1" stopColor="#565861"/>
                </linearGradient>
                <linearGradient id="paint1_linear_1731_62" x1="44.7956" y1="13.6484" x2="62.2863" y2="31.4386" gradientUnits="userSpaceOnUse">
                <stop offset="0.21" stopColor="#F15A24"/>
                <stop offset="0.6841" stopColor="#FBB03B"/>
                </linearGradient>
                <linearGradient id="paint2_linear_1731_62" x1="31.2044" y1="35.3515" x2="13.7136" y2="17.5614" gradientUnits="userSpaceOnUse">
                <stop offset="0.21" stopColor="#ED1E79"/>
                <stop offset="0.8929" stopColor="#522785"/>
                </linearGradient>
                </defs>
                </svg>
          </Link>
      </Box>
    </Card>
  );
};
