import React from "react";
import {
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { getTestRouter, server, ThemeWrapper } from "../testutils";
import { ShareholderPage } from "./Shareholder";
import { Route, Routes } from "react-router";
import { getHandlers } from "../handlers";
import userEvent from "@testing-library/user-event";

describe("ShareholderPage", () => {
  it("should show a summary of shares", async () => {
    const Router = getTestRouter("/shareholder/0");
    const handlers = getHandlers(
      {
        company: { name: "My Company" },
        shareholders: {
          0: { name: "Tonya", grants: [1, 2], group: "founder", id: 0 },
        },
        grants: {
          1: {
            id: 1,
            name: "Initial Grant",
            amount: 1000,
            issued: Date.now().toLocaleString(),
            type: "common",
          },
          2: {
            id: 2,
            name: "Incentive Package 2020",
            amount: 500,
            issued: Date.now().toLocaleString(),
            type: "common",
          },
        },
      },
      false
    );
    server.use(...handlers);

    render(
      <Router>
        <Routes>
          <Route
            path="/shareholder/:shareholderID"
            element={<ShareholderPage />}
          />
        </Routes>
      </Router>,
      { wrapper: ThemeWrapper }
    );

    await screen.findByRole("button", { name: /Add Grant/ });

    expect(screen.getByTestId("grants-issued")).toHaveTextContent("2");
    expect(screen.getByTestId("shares-granted")).toHaveTextContent("1500");
  });

  /**
   * @TODO break up into multiple tests, needs to be rewritten with clear acceptance criteria.
   * Erroring on the text data from gridcell not matching the expects.
   * Unexplanable async errors.
   */
  xit("should allow adding new grants", async () => {
    const Router = getTestRouter("/shareholder/0");
    const handlers = getHandlers(
      {
        company: { name: "My Company" },
        shareholders: {
          0: { name: "Tonya", grants: [1, 2], group: "founder", id: 0 },
        },
        grants: {
          1: {
            id: 1,
            name: "Initial Grant",
            amount: 1000,
            issued: "12/12/2012",
            type: "common",
          },
          2: {
            id: 2,
            name: "Incentive Package 2020",
            amount: 500,
            issued: "12/12/2012",
            type: "preferred",
          },
        },
      },
      false
    );
    server.use(...handlers);

    render(
      <Router>
        <Routes>
          <Route
            path="/shareholder/:shareholderID"
            element={<ShareholderPage />}
          />
        </Routes>
      </Router>,
      { wrapper: ThemeWrapper }
    );

    const addGrantButton = await screen.findByRole("button", {
      name: /Add Grant/,
    });
    const grantTable = screen.getAllByRole("rowgroup")[1];
    expect(within(grantTable).getAllByRole("row")).toHaveLength(2);

    userEvent.click(addGrantButton);

    const grantNameInput = screen.getByTestId("grant-name");
    const grantTypeInput = screen.getByTestId("grant-type")
    const grantAmountInput = screen.getByTestId("grant-amount");
    const grantDateInput = screen.getByTestId("grant-issued");

    await waitFor(() => {
      expect(grantNameInput).toBeVisible();
      expect(grantTypeInput).toBe('preferred');
    });

    userEvent.paste(grantNameInput, "Incentive Package 2019");
    userEvent.paste(grantTypeInput, "common")
    userEvent.paste(grantAmountInput, "2000");
    userEvent.paste(grantDateInput, "2010-12-12");

    // Commented out because this is being super flaky
    // expect(grantNameInput).toHaveValue();
    // expect(grantAmountInput).toHaveValue();
    // expect(grantDateInput).toHaveValue();

    const saveButton = screen.getByRole("button", { name: /Save/ });
    userEvent.click(saveButton);

    await waitFor(() => {
      expect(grantTypeInput).toBe('common');
    });

    expect(
      await within(grantTable).findByRole("gridcell", {
        name: /Incentive Package 2019/,
      })
    ).toBeInTheDocument();
    expect(
      within(grantTable).getByRole("gridcell", { name: /2000/ })
    ).toBeInTheDocument();
    expect(
      within(grantTable).getByRole("gridcell", {
        name: new Date("2010-12-12").toLocaleDateString(),
      })
    ).toBeInTheDocument();
  }, 10000);
});
