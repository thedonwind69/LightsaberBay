import React, { Component, useState, useReducer, useEffect} from 'react'
import {Link} from 'react-router-dom';
import Lightsaber from './lightsaber';
import * as LightsaberAPIUtil from '../util/lightsaber_api_util';
import * as UserAPIUtil from '../util/user_api_util';
import UserInfo from './userInfo';

const lightsaberReducer = (state, action) => {
    switch(action.type) {
        case "fetchAllLightsabers": 
            return action.payload;
        case "unmountAllLightsabers": 
            return [];
        case "buyLightsaber":
            var newState = [];
            for (let i=0; i<state.length; i++) {
                if (state[i].id !== action.payload.id) {
                    newState.push(state[i]);
                }
            }
            return newState;
        default:
            return state;
    }
}

const userReducer = (state, action) => {
    switch(action.type) {
        case "fetchUser": 
            return action.payload;
        case "updateUsersCredits":
            return action.payload;
        default:
            return state;
    }
}

function fetchAllTheLightsabers (dispatch) {
        LightsaberAPIUtil.fetchAllLightsabers().then((all_lightsabers) =>  {
            dispatch({type: "fetchAllLightsabers", payload: all_lightsabers})
        })
    };

function buyLightsaber (lightsaber, lightsaber_id, dispatch) {
    LightsaberAPIUtil.buyLightsaber(lightsaber, lightsaber_id).then( (single_lightsaber) => (
        dispatch({type: "buyLightsaber", payload: single_lightsaber})
    ), err => (
        dispatch({type: "buyLightsaberErrors", payload: err.responseJSON})
    ));
}

function fetchUser (user_id, dispatch) {
    UserAPIUtil.fetchUser(user_id).then((current_user) => {
        dispatch({type: "fetchUser", payload: current_user});
    })
}

function updateUsersCredits ( user, user_id , dispatch) {
    UserAPIUtil.updateUsersCredits(user, user_id).then((user) => {
        dispatch({type: "updateUsersCredits", payload: user})
    })
}

/////////COMPONENT HERE:
export default function Marketplace(props) {
    var localStorageCurrentUser = JSON.parse(localStorage.getItem("currentLoggedInUser"));
    var [state, dispatch] = useReducer(lightsaberReducer, []);
    var [userState, userDispatch] = useReducer(userReducer);
    var [filterState, setFilterState] = useState({
        color: "None",
        style: "None",
    })
    var [sortState, setSortState] = useState({sortBy: null})

    useEffect(() => {
        if (localStorageCurrentUser) {
            fetchAllTheLightsabers(dispatch);
            fetchUser(localStorageCurrentUser.id, userDispatch);
        }
    }, [])

    useEffect(() => {
        return () => {
            dispatch({type: "unmountAllLightsabers"})
        }
    }, [])


    function handleChangeFilter (category) {
        return (event) => {
            if (event.target.value) {
                setFilterState({...filterState,
                    [category]: event.target.value
                })
            }
            
        }
    }

    function handleChangeSortFilter (category) {
        return (event) => {
            if (event.target.value) {
                setSortState({[category]: event.target.value})
            }
            
        }
    }

    // const displayAllLightsabersForSale = state.map((lightsaber) => {
    //     if (lightsaber.forsale) {
    //         return (
    //             <div><Lightsaber 
    //                 buyLightsaber={buyLightsaber} 
    //                 dispatch={dispatch} 
    //                 lightsaber={lightsaber}
    //                 userDispatch={userDispatch}
    //                 userState={userState}
    //                 updateUsersCredits={updateUsersCredits}
    //             />
    //             </div>
    //         )
    //     }
    // });

    const mapLightsabers = (array) => {
       return array.map((lightsaber) => {
            if (lightsaber.forsale) {
                return (
                    <div><Lightsaber 
                        buyLightsaber={buyLightsaber} 
                        dispatch={dispatch} 
                        lightsaber={lightsaber}
                        userDispatch={userDispatch}
                        userState={userState}
                        updateUsersCredits={updateUsersCredits}
                    />
                    </div>
                )
            }  
        })
    };

    function displayAllLightsabersAfterFiltered () {
        var endArray;
        var filterStateKeysArray = Object.keys(filterState);

        // if return lightsabers if no filters are selected:

        var noFiltersAtAll = filterStateKeysArray.every((category) => filterState[category] === "None");
        if (noFiltersAtAll) {
            if (!sortState.sortBy) {
                endArray = state.reverse();
            } else if (sortState.sortBy === "Most Recent") {
            
                endArray = state.sort((a, b) => {
                    var keyA = new Date(a.updated_at),
                        keyB = new Date(b.updated_at);
                        return keyB - keyA;
                })

            } else if (sortState.sortBy === "PriceLowToHigh") {
                endArray = state.sort((a, b) => a.price - b.price);
            } else if (sortState.sortBy === "PriceHighToLow") {
                endArray = state.sort((a, b) => b.price - a.price);
            }
            return mapLightsabers(endArray);
        };

        // return the array if filters are selected:
       
        var numberOfActiveFilters = 0;
        filterStateKeysArray.forEach((key) => {
            if (filterState[key] !== "None") {numberOfActiveFilters +=1 }
        })

        var newArray = [];

        if (numberOfActiveFilters === 1) {
            for (let i = 0; i < filterStateKeysArray.length; i++) {
                var currentKey = filterStateKeysArray[i];
                if (filterState[currentKey] === "None")  {
                    continue;
                }
                for (let j = 0; j < state.length; j++) {
                    var currentSaber = state[j];
                    if (currentSaber.forsale) {
                        if (filterState[currentKey] === currentSaber[currentKey]) {
                           newArray.push(currentSaber) 
                        }
                    }
                }
            }
        } else if (numberOfActiveFilters === 2) {
            for (let j = 0; j < state.length; j++) {
                var currentSaber = state[j];
                var key1 = filterStateKeysArray[0];
                var key2 = filterStateKeysArray[1];
                if (filterState[key1] === currentSaber[key1] && filterState[key2] === currentSaber[key2]) {
                    newArray.push(currentSaber);
                }
            }
        }
        
        // handle sorting the array based on 'Sort By':

        var lastArrayAfterFiltered = [];
        if (!sortState.sortBy) {
            lastArrayAfterFiltered = newArray.reverse();
        } else if (sortState.sortBy === "Most Recent") {
        
            lastArrayAfterFiltered = newArray.sort((a, b) => {
                var keyA = new Date(a.updated_at),
                    keyB = new Date(b.updated_at);
                    return keyB - keyA;
            })

        } else if (sortState.sortBy === "PriceLowToHigh") {
            lastArrayAfterFiltered = newArray.sort((a, b) => a.price - b.price);
        } else if (sortState.sortBy === "PriceHighToLow") {
            lastArrayAfterFiltered = newArray.sort((a, b) => b.price - a.price);
        }

        return mapLightsabers(lastArrayAfterFiltered);
        
    };

    if (localStorageCurrentUser) {
        return (
        <div id="marketplace-container">
            <div class="clearfix"></div>

            <UserInfo userState={userState}/>

            <div class="filters-bar">
                <select onChange={handleChangeFilter("color")} name="colorfilter" id="colorfilter"> 
                    <option value="none" selected disabled hidden> 
                        Color
                    </option> 
                        <option value={"None"}>None</option> 
                        <option value="blue">blue</option> 
                        <option value="red">red </option> 
                        <option value="yellow">yellow</option> 
                        <option value="green">green</option> 
                        <option value="purple">purple</option> 
                </select> 

                <select onChange={handleChangeFilter("style")} name="style" id="style"> 
                    <option value="none" selected disabled hidden> 
                        Style
                    </option> 
                        <option value={"None"}>None</option> 
                        <option value="single">Single-Bladed</option> 
                        <option value="double">Double-Bladed </option> 
                </select>

                <select onChange={handleChangeSortFilter("sortBy")} name="sortBy" id="sortBy"> 
                    <option value="none" selected disabled hidden> 
                        Sort By
                    </option> 
                        <option value="Most Recent">Most Recent</option> 
                        <option value="PriceLowToHigh">Price: Low to High</option> 
                        <option value="PriceHighToLow">Price: High to Low</option>
                </select> 
            </div>

            <div class="clearfix"></div>
            
            <div class="all-lightsabers-container">
                {displayAllLightsabersAfterFiltered()}
            </div>
            
        </div>
        )
    
    } else {
        return <h1 class="greeting-logged-in">You are not logged in. Click <Link to="/login">Here</Link> to login or <Link to="/signup">Here</Link> to sign up.</h1>
    }
}
