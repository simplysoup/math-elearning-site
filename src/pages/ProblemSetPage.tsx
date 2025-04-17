import { useParams } from "react-router-dom"

const ProblemSetPage = () => {
    const { setId } = useParams();

    return (
        <div>
            <h1 className="text-2xl font-bold mb-4">Problem Set: {setId}</h1>
            <p>This page will contain a problem set description and list of problems.</p>
        </div>
    );
};

export default ProblemSetPage
