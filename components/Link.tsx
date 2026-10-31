import NextLink from "next/link";
import type { ComponentProps } from "react";

/**
 * next/link without prefetching, for the student pages.
 *
 * A link prefetches its page the moment it scrolls into view. Every page a
 * student can reach is rendered for them on the server, and the portal's
 * loading screen sits at the root, so a prefetch renders nothing but that
 * screen: one server call and a few kilobytes for every paper, result and
 * mock a list shows, tens of them a view, that the click then renders
 * again in full. At the exam's size that was most of the portal's server
 * calls. The click still shows the loading screen the moment the page's
 * first bytes arrive.
 *
 * Pass prefetch explicitly to a link that should keep it.
 */
export default function Link({ prefetch = false, ...props }: ComponentProps<typeof NextLink>) {
  return <NextLink prefetch={prefetch} {...props} />;
}
