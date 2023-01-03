import {
  Item,
  itemAmount,
  mallPrice,
  putShop,
  wellStocked,
  autosellPrice,
  autosell,
  putDisplay,
  use,
  print,
  putCloset,
  cliExecute,
} from "kolmafia";
import { Kmail } from "libram";
import { Options } from "./options";
import { TabTitle } from "./types";

function amount(item: Item, options: Options) {
  if (options.keep) {
    return Math.max(0, itemAmount(item) - options.keep);
  } else {
    return itemAmount(item);
  }
}

export function filters(options: Options): (item: Item) => boolean {
  if (options.priceUpperThreshold && options.priceLowerThreshold) {
    const between = (x: number, lower: number, upper: number) => lower < x && x < upper;
    const upperThreshold = options.priceUpperThreshold;
    const lowerThreshold = options.priceLowerThreshold;
    return (item: Item) => between(mallPrice(item), lowerThreshold, upperThreshold);
  }
  return (item: Item) => true;
}

export const actions: {
  [T in TabTitle]: (options: Options) => {
    action: (item: Item) => void;
    finalize?: () => void;
  };
} = {
  mall: (options: Options) => {
    return { action: (item: Item) => putShop(0, 0, amount(item, options), item) };
  },
  sell: (options: Options) => {
    return {
      action: (item: Item) => {
        if (wellStocked(`${item}`, 1000, Math.min(100, autosellPrice(item) * 2))) {
          autosell(amount(item, options), item);
        } else {
          putShop(0, 0, amount(item, options), item);
        }
      },
    };
  },
  display: (options: Options) => {
    return { action: (item: Item) => putDisplay(amount(item, options), item) };
  },
  use: (options: Options) => {
    return { action: (item: Item) => use(amount(item, options), item) };
  },
  autosell: (options: Options) => {
    return { action: (item: Item) => autosell(amount(item, options), item) };
  },
  kmail: (options: Options) => {
    const items: Item[] = [];
    return {
      action: (item: Item) => items.push(item),
      finalize: () => {
        const target = options.target ?? options.default;
        if (!target) {
          throw "You must specify a User # to Kmail!";
        }
        const itemQuantities = new Map<Item, number>(items.map((i) => [i, amount(i, options)]));
        print(`Sending Kmail to ${target}`);
        Kmail.send(target, options.body ?? "", itemQuantities);
      },
    };
  },
  closet: (options: Options) => {
    return {
      action: (item: Item) => putCloset(amount(item, options), item),
    };
  },
  fuel: (options: Options) => {
    return {
      action: (item: Item) => cliExecute(`asdonmartin fuel ${amount(item, options)} ${item}`),
    };
  },
};