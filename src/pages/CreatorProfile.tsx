import { useParams } from "react-router-dom";
import CreatorCanvas from "@/components/creator/CreatorCanvas";

const CreatorProfile = () => {
  const { handle } = useParams<{ handle: string }>();
  return <CreatorCanvas isEditing={false} handleParam={handle} />;
};

export default CreatorProfile;
