import "react-leaflet";

declare module "react-leaflet" {
  export interface MarkerProps {
    rotationAngle?: number;
    rotationOrigin?: string;
  }
}
