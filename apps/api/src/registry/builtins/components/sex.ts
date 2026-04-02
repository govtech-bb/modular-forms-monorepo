import { RadioPrimitive } from "../../types";

export const Sex: RadioPrimitive = {
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
