import { SelectPrimitive } from "../../types";

export const Title: SelectPrimitive = {
  fieldId: "title",
  htmlType: "select",
  label: "Title",
  options: [
    {
      key: "Mr",
      value: "mr"
    },
    {
      key: "Miss",
      value: "miss"
    },
    {
      key: "Mrs",
      value: "mrs"
    }
  ],
  multiple: false,
}
