import { useEffect } from "react";
import { useNavigate } from "react-router";

export default function StudioIndex() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate("/studio/dashboard", { replace: true });
  }, [navigate]);

  return null;
}
