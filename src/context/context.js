import React, { useState, useEffect, useContext } from "react";
import mockUser from "./mockData.js/mockUser";
import mockRepos from "./mockData.js/mockRepos";
import mockFollowers from "./mockData.js/mockFollowers";
import axios from "axios";

const rootUrl = "https://api.github.com";
const GithubContext = React.createContext();

const GithubProvider = ({ children }) => {
  const [githubUser, setGithubUser] = useState(mockUser);
  const [repos, setRepos] = useState(mockRepos);
  const [followers, setFollowers] = useState(mockFollowers);

  //Error
  const [error, setError] = useState({ show: false, msg: "" });

  //requests and loading
  const [requests, setRequests] = useState(0);
  const [loading, setLoading] = useState(false);

  //get github user
  const getGithubUser = async (user) => {
    //setLoading
    //deal with error
    //fetch using axios
    setLoading(true);
    toggleError();
    const resp = await axios(`${rootUrl}/users/${user}`).catch((err) =>
      console.log(err)
    );
    if (resp) {
      setGithubUser(resp.data);
      //to get all the data concurrently
      const { login, followers_url } = resp.data;
      // await Promise.allSettled(
      //   [
      //     axios(`${rootUrl}/users/${user}/followers`),
      //     ,
      //     axios(`${rootUrl}/users/${login}/repos?per_page=100`),
      //   ].then((results) => {
      //     console.log(results);
      //   })
      // );
      /*
      ==========
      get repos
      https://api.github.com/users/Itsvi-ctor/repos?per_page=100
      ==========
      */
      await axios(`${rootUrl}/users/${login}/repos?per_page=100`).then((resp) =>
        setRepos(resp.data)
      );
    } else {
      setError({ show: true, msg: "there is no user with that username" });
    }
    // for followers
    const response = await axios(`${rootUrl}/users/${user}/followers`).catch(
      (err) => console.log(err)
    );
    if (response) {
      setFollowers(response.data);
    }
    checkRateLimit();
    setLoading(false);
  };

  //Rate limit
  const checkRateLimit = () => {
    axios(`${rootUrl}/rate_limit`)
      .then(
        ({
          data: {
            rate: { limit, reset, used, remaining },
          },
        }) => {
          setRequests(remaining);
          if (remaining === 0) {
            //throw error
            toggleError(true, "Sorry, you have eceeded your hourly searches");
          }
        }
      )
      .catch((err) => console.log(err));
  };

  //Error
  const toggleError = (show = false, msg = "") => {
    setError({ show, msg });
  };
  useEffect(checkRateLimit, []);
  return (
    <GithubContext.Provider
      value={{
        githubUser,
        repos,
        followers,
        requests,
        error,
        getGithubUser,
        loading,
      }}
    >
      {children}
    </GithubContext.Provider>
  );
};

export const useGlobalContext = () => {
  return useContext(GithubContext);
};

export { GithubContext, GithubProvider };
