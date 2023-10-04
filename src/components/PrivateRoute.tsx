import { Navigate, useLocation } from "react-router-dom";
import { FC } from "react";
import { useStore } from "../store";

type PrivateRouteProps = {
  children: React.ReactNode;
};

const PrivateRoute: FC<PrivateRouteProps> = ({ children }) => {
  const currentUser = useStore((state) => state.currentUser);
  const location = useLocation();

  if (!currentUser)
    return (
      <Navigate
        to={`/sign-in?redirect=${encodeURIComponent(
          location.pathname + location.search
        )}`}
      />
    );

  return <>{children}</>;
};

export default PrivateRoute;
