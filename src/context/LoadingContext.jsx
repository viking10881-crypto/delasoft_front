import { createContext, useContext, useState } from "react";
import LoadingScreen from "../components/LoadingScreen";

const LoadingContext = createContext();

export const LoadingProvider = ({ children }) => {
  const [active, setActive] = useState(false);

  const startLoading = () => setActive(true);
  const stopLoading = () => setActive(false);

  return (
    <LoadingContext.Provider value={{ startLoading, stopLoading }}>
      {active && <LoadingScreen />}
      {children}
    </LoadingContext.Provider>
  );
};

export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error("useLoading debe usarse dentro de un LoadingProvider");
  }
  return context;
};