import { OptionPrimitive } from "../../types";

export const Sex: OptionPrimitive = {
  fieldId: "sex",
  htmlType: "radio",
  label: "Sex",
  options: [
    {
      key: "Male",
      value: "male"
    },
    {
      key: "Female",
      value: "female"
    }
  ]
}
