import { render } from "@react-email/render";
import type { ReactElement } from "react";

export interface RenderedEmail {
  html: string;
  subject: string;
  text: string;
}

export const renderElement = async (
  element: ReactElement,
  subject: string
): Promise<RenderedEmail> => {
  const [html, text] = await Promise.all([
    render(element),
    render(element, { plainText: true }),
  ]);
  return { html, subject, text };
};
