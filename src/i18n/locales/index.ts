import enCommon from "./en/common.json";
import enAuth from "./en/auth.json";
import enShipment from "./en/shipment.json";
import enContainer from "./en/container.json";
import enOrganization from "./en/organization.json";
import enDashboard from "./en/dashboard.json";
import enValidation from "./en/validation.json";

import amCommon from "./am/common.json";
import amAuth from "./am/auth.json";
import amShipment from "./am/shipment.json";
import amContainer from "./am/container.json";
import amOrganization from "./am/organization.json";
import amDashboard from "./am/dashboard.json";
import amValidation from "./am/validation.json";

import soCommon from "./so/common.json";
import soAuth from "./so/auth.json";
import soShipment from "./so/shipment.json";
import soContainer from "./so/container.json";
import soOrganization from "./so/organization.json";
import soDashboard from "./so/dashboard.json";
import soValidation from "./so/validation.json";

import tiCommon from "./ti/common.json";
import tiAuth from "./ti/auth.json";
import tiShipment from "./ti/shipment.json";
import tiContainer from "./ti/container.json";
import tiOrganization from "./ti/organization.json";
import tiDashboard from "./ti/dashboard.json";
import tiValidation from "./ti/validation.json";

import omCommon from "./om/common.json";
import omAuth from "./om/auth.json";
import omShipment from "./om/shipment.json";
import omContainer from "./om/container.json";
import omOrganization from "./om/organization.json";
import omDashboard from "./om/dashboard.json";
import omValidation from "./om/validation.json";

export const resources = {
  en: {
    common: enCommon,
    auth: enAuth,
    shipment: enShipment,
    container: enContainer,
    organization: enOrganization,
    dashboard: enDashboard,
    validation: enValidation,
  },
  am: {
    common: amCommon,
    auth: amAuth,
    shipment: amShipment,
    container: amContainer,
    organization: amOrganization,
    dashboard: amDashboard,
    validation: amValidation,
  },
  so: {
    common: soCommon,
    auth: soAuth,
    shipment: soShipment,
    container: soContainer,
    organization: soOrganization,
    dashboard: soDashboard,
    validation: soValidation,
  },
  ti: {
    common: tiCommon,
    auth: tiAuth,
    shipment: tiShipment,
    container: tiContainer,
    organization: tiOrganization,
    dashboard: tiDashboard,
    validation: tiValidation,
  },
  om: {
    common: omCommon,
    auth: omAuth,
    shipment: omShipment,
    container: omContainer,
    organization: omOrganization,
    dashboard: omDashboard,
    validation: omValidation,
  },
} as const;
