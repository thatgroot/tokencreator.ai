export const StringHelper = {
  replacePlaceholders: (
    contract: string,
    values: { [key: string]: any }
  ): string => {
    return Object.entries(values).reduce((replacedContract, [key, value]) => {
      const placeholder = new RegExp(`<${key}>`, "g");
      return replacedContract.replace(placeholder, value);
    }, contract);
  },
};
