import "react-native-reanimated";
/** NativeWind v4 — global Tailwind/CSS entry (import exactly once at app root). */
import "./global.css";
import { registerRootComponent } from "expo";

import AppRoot from "./AppRoot";

registerRootComponent(AppRoot);
