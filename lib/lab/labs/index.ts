import type { LabSpec } from "../types";
import { ciscoOspf } from "./cisco-ospf";
import { ciscoVlan } from "./cisco-vlan";
import { mikrotikDhcpStatic } from "./mikrotik-dhcp-static";
import { mikrotikDuaKantor } from "./mikrotik-dua-kantor";
import { mikrotikFirewallNat } from "./mikrotik-firewall-nat";
import { mikrotikFirewallSegmentasi } from "./mikrotik-firewall-segmentasi";
import { mikrotikFirstRouter } from "./mikrotik-first-router";
import { mikrotikKedaiKopi } from "./mikrotik-kedai-kopi";
import { mikrotikRoutingTroubleshooting } from "./mikrotik-routing-troubleshooting";
import { mikrotikStaticRouting } from "./mikrotik-static-routing";
import { mikrotikTroubleshooting } from "./mikrotik-troubleshooting";
import { mikrotikWireguard } from "./mikrotik-wireguard";
import { mikrotikWireguardHub } from "./mikrotik-wireguard-hub";
import { ciscoDasar } from "./cisco-dasar";
import { ciscoDhcp } from "./cisco-dhcp";
import { ciscoStaticRouting } from "./cisco-static-routing";
import { ciscoAcl } from "./cisco-acl";
import { ciscoNatPat } from "./cisco-nat-pat";
import { ciscoRouterOnAStickDhcp } from "./cisco-router-on-a-stick-dhcp";
import { ciscoHotel } from "./cisco-hotel";
import { ciscoOspfDefaultRoute } from "./cisco-ospf-default-route";
import { ciscoRoutingTroubleshooting } from "./cisco-routing-troubleshooting";
import { ciscoDuaGedung } from "./cisco-dua-gedung";
import { ciscoKampus } from "./cisco-kampus";
import { ciscoKantorCabang } from "./cisco-kantor-cabang";
import { ciscoSekolahAcl } from "./cisco-sekolah-acl";
import { ciscoTokoBuku } from "./cisco-toko-buku";
import { mikrotikDuaRuko } from "./mikrotik-dua-ruko";
import { mikrotikDualIsp } from "./mikrotik-dual-isp";
import { mikrotikEkspedisi } from "./mikrotik-ekspedisi";
import { mikrotikTokoCabang } from "./mikrotik-toko-cabang";
import { mikrotikWarnet } from "./mikrotik-warnet";

export const labSpecs: LabSpec[] = [
  mikrotikFirstRouter,
  mikrotikDhcpStatic,
  mikrotikStaticRouting,
  mikrotikFirewallNat,
  mikrotikFirewallSegmentasi,
  mikrotikDuaKantor,
  mikrotikWireguard,
  mikrotikWireguardHub,
  mikrotikTroubleshooting,
  mikrotikRoutingTroubleshooting,
  mikrotikKedaiKopi,
  ciscoVlan,
  ciscoOspf,
  ciscoDasar,
  ciscoStaticRouting,
  ciscoDhcp,
  ciscoNatPat,
  ciscoAcl,
  ciscoRouterOnAStickDhcp,
  ciscoOspfDefaultRoute,
  ciscoHotel,
  ciscoRoutingTroubleshooting,
  mikrotikWarnet,
  mikrotikDuaRuko,
  mikrotikEkspedisi,
  mikrotikDualIsp,
  mikrotikTokoCabang,
  ciscoTokoBuku,
  ciscoDuaGedung,
  ciscoKantorCabang,
  ciscoKampus,
  ciscoSekolahAcl,
];

/**
 * Cocokkan lab di daftar (lib/data) dengan spesifikasinya:
 * lewat id, atau lewat judul yang sama persis.
 */
export function findLabSpec(ref: {
  id: string | number;
  title?: string;
}): LabSpec | undefined {
  return (
    labSpecs.find((s) => s.id === String(ref.id)) ??
    (ref.title ? labSpecs.find((s) => s.title === ref.title) : undefined)
  );
}