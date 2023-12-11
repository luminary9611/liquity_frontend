<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@liquity/lib-base](./lib-base.md) &gt; [LPStakeChange](./lib-base.lpstakechange.md)

## LPStakeChange type

Represents the change between two states of an LP Stake.

<b>Signature:</b>

```typescript
export declare type LPStakeChange<T> = {
    stakeLP: T;
    unstakeLP?: undefined;
} | {
    stakeLP?: undefined;
    unstakeLP: T;
    unstakeAllLP: boolean;
};
```