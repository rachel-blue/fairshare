import React from "react";
import { render, screen } from "@testing-library/react";
import { Home } from "./Home";
import { Route, Routes } from "react-router-dom";
import userEvent from "@testing-library/user-event";
import { getTestRouter, ThemeWrapper } from "../testutils";

describe("Home", () => {
  it("should link to onboard", () => {
    const Router = getTestRouter("/");
    render(
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/start">
            <div>Success it worked</div>
          </Route>
        </Routes>
      </Router>,
      { wrapper: ThemeWrapper }
    );
    const buttons = screen.getAllByRole("link");
    expect(buttons).toHaveLength(2);
    userEvent.click(buttons[0]);
    screen.getByText("Success it worked");
  });

  it("should link to signin", () => {
    const Router = getTestRouter("/");
    render(
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/signin">
            <div>Success it worked</div>
          </Route>
        </Routes>
      </Router>,
      { wrapper: ThemeWrapper }
    );
    const buttons = screen.getAllByRole("link");
    expect(buttons).toHaveLength(2);
    userEvent.click(buttons[1]);
    screen.getByText("Success it worked");
  });
});
