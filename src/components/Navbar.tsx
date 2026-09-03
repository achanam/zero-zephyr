"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandMarkIcon, HomeIcon, SendIcon, HelpCircleIcon } from "@/components/Send-Logic/icons";
import styles from "@/styles/navbar.module.css";
import type { SVGProps } from "react";

type NavItem = {
  href: string;
  label: string;
  icon: (p: SVGProps<SVGSVGElement>) => React.JSX.Element;
};

const HOME: NavItem = { href: "/", label: "Home", icon: HomeIcon };
const SEND: NavItem = { href: "/send", label: "Send", icon: SendIcon };
const FAQ: NavItem = { href: "/faq", label: "FAQ", icon: HelpCircleIcon };

// Each page shows links to the two other sections, not itself.
function getNavItems(pathname: string): NavItem[] {
  if (pathname === "/") return [SEND, FAQ];
  if (pathname.startsWith("/faq")) return [SEND, HOME];
  if (pathname.startsWith("/send")) return [HOME, FAQ];
  // Any other route (e.g. /receive/[slug], 404): show the full nav.
  return [HOME, SEND, FAQ];
}

export function Navbar() {
  const pathname = usePathname();
  const items = getNavItems(pathname || "/");

  return (
    <nav className={styles.navbar} aria-label="Main navigation">
      <div className={styles.inner}>
        <a
          href="https://github.com/achanam/zero-zephyr"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.brand}
          aria-label="Zero Zephyr on GitHub"
        >
          <BrandMarkIcon className={styles["brand-icon"]} />
          <span className={styles["brand-text"]}>
            ZERO <span>ZEPHYR</span>
          </span>
        </a>

        <div className={styles.links}>
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} className={styles.link}>
                <Icon />
                <span className={styles["link-label"]}>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
