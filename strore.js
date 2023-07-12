import { createStore, combineReducers } from "redux";

function dataReducer(state = null, action) {
  switch (action.type) {
    case "SET_DATA":
      return action.data;
    default:
      return state;
  }
}

function data2Reducer(state = null, action) {
  switch (action.type) {
    case "SET_DATA2":
      return action.data2;
    default:
      return state;
  }
}

const rootReducer = combineReducers({
  data: dataReducer,
  data2: data2Reducer
});

const store = createStore(rootReducer);

export default store;
