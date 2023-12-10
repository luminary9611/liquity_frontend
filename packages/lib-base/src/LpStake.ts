import { Decimal, Decimalish } from "./Decimal";
/**
 * Represents the change between two states of an LP Stake.
 *
 * @public
 */
export type LPStakeChange<T> =
  | { stakeLP: T; unstakeLP?: undefined }
  | { stakeLP?: undefined; unstakeLP: T; unstakeAllLP: boolean };

/**
 * Represents a user's LP stake and accrued gains.
 * @public
 */
export class LPStake {
  /** The amount of LP that's staked. */
  readonly stakedLP: Decimal;

  /** Amount of LQTY rewarded since the last modification of the LP stake. */
  readonly lqtyReward: Decimal;

  /** @internal */
  constructor(stakedLP = Decimal.ZERO, lqtyReward = Decimal.ZERO) {
    this.stakedLP = stakedLP;
    this.lqtyReward = lqtyReward;
  }

  get isEmpty(): boolean {
    return this.stakedLP.isZero && this.lqtyReward.isZero;
  }

  /** @internal */
  toString(): string {
    return `{ stakedLP: ${this.stakedLP}` + `, lqtyReward: ${this.lqtyReward} }`;
  }

  /**
   * Compare to another instance of `LPStake`.
   */
  equals(that: LPStake): boolean {
    return this.stakedLP.eq(that.stakedLP) && this.lqtyReward.eq(that.lqtyReward);
  }

  /**
   * Calculate the difference between this `LPStake` and `thatStakedLP`.
   *
   * @returns An object representing the change, or `undefined` if the staked amounts are equal.
   */
  whatChanged(thatStakedLP: Decimalish): LPStakeChange<Decimal> | undefined {
    thatStakedLP = Decimal.from(thatStakedLP);

    if (thatStakedLP.lt(this.stakedLP)) {
      return {
        unstakeLP: this.stakedLP.sub(thatStakedLP),
        unstakeAllLP: thatStakedLP.isZero
      };
    }

    if (thatStakedLP.gt(this.stakedLP)) {
      return { stakeLP: thatStakedLP.sub(this.stakedLP) };
    }
  }

  /**
   * Apply a {@link LPStakeChange} to this `LPStake`.
   *
   * @returns The new staked LP amount.
   */
  apply(change: LPStakeChange<Decimalish> | undefined): Decimal {
    if (!change) {
      return this.stakedLP;
    }

    if (change.unstakeLP !== undefined) {
      return change.unstakeAllLP || this.stakedLP.lte(change.unstakeLP)
        ? Decimal.ZERO
        : this.stakedLP.sub(change.unstakeLP);
    } else {
      return this.stakedLP.add(change.stakeLP);
    }
  }
}
