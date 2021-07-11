# Fair Share

Welcome to Admiral! We have pivoted, and now our product is an equity sharing app. We're still in MVP phase, and are excited for our new hires to help build our app.

## Frontend

The frontend of the application is a React application that uses context and React Query to manage state.

You can find documentation for these here:
https://reactjs.org/docs/context.html
https://react-query.tanstack.com/

Importantly, there are two key conepts for React Query: mutations and queries. When you want to update data, you use a mutation. When you're just referencing data, you use a query. 

The application is broken up into a few main areas:

### Styles
We use chakra for our component library. We really like it! Please use it for new UI features.

https://chakra-ui.com/docs/getting-started

### Testing

We use Jest and Testing Library to write our tests. So far we have okay tests, but they're not perfect. We're always looking for improvement, but we do require that new features include tests!

https://jestjs.io/
https://testing-library.com/docs/react-testing-library/intro

### Structure

#### Onboarding
This portion of the app contains components for all of the steps in the onboarding process

#### Dashboard
The dashboard contains company and aggregated metrics which show how ownership is broken down across all shareholders.

#### Shareholder
The ShareholderPage contains data specific to a just a single shareholder, and shows how much equity they have.

Today, the app allows basic create operations but isn't great for updates (or other operations). We need your help to improve this functionality.

## Backend

We're saving server expenses by mocking all network calls using MSW. You don't need to understand what MSW is, other than that we use it to define handlers for outgoing network calls. No servers === no problems.

The behavior of our "backend" is defined by the "handlers" in `handlers.ts`. If you need to make changes or add endpoints, this is where you can do this.

You probably don't need to worry about our database--its just some objects in memory on the user's browers. Its genius, right?

 

# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Yarn

If you don't have yarn, please install it by running

```
npm install --global yarn
```

## Installing dependencies

Installing dependencies with `yarn` is easy. Simply run it in the base directory without any arguments, and it will get you what you need.

```
yarn
```

## Available Scripts

In the project directory, you can run:

### `yarn start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `yarn test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `yarn build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `yarn eject`

**Note: this is a one-way operation. Once you `eject`, you can’t go back!**

If you aren’t satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you’re on your own.

You don’t have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn’t feel obligated to use this feature. However we understand that this tool wouldn’t be useful if you couldn’t customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).


# Ray's Bug Hunting Notes
This section will be broken up into bugs found while using the app, code issues,
architecture/component abstraction, and testing refactor notes. They will also be listed 
by priorities.

Due to time concerns I mostly followed existing design patterns in the code base to complete my tasks.

## Breakdown
- **1 = Critical Path** - must be fixed for the application to be acceptably usable
- **2 = Secondary Concern** - still important for usability, would improve app reliability or user experience
- **3 = Code Quality** - larger changes that would improve the developers ability to edit and maintain the code base
- **4 = Nice to Have** - would be fixed in an ideal world but not as crucial or beneficial as the other tasks and therefore not a priority

### 1 - Critical Path
- Sign in
  - Could't even test the sign in page because of the inability to navigate to it. Reroutes to dashboard if a user persists in local storage, and doesn't save login credentials if there isn't a user in local storage
  - Needs Ability to sign out from dashboard
- Dashboard
  - Visual display bugs
    - Clipping of text on the left and right of pie graph
    - Overlapping of text when there is no grant/share data to push the text apart
- Grants
  - Missing ability to edit grants 
  - Missing ability to delete grants
- Shareholders page
  - Needs navigation back to dashboard

### 2 - Secondary Concern
- Form validation
  - `type of shareholder` should not be selectable
  - `type of share` should not be selectable
  - should not be able to submit without critical content
- Failing test (skipped)
  - On startup the test suite had one failing test, needs heavy re-work and for now I skipped that test with a @TODO note

### 3 - Code Quality / Architecture
- Single responsibility
  - Most components are violating single responsibility and this makes them difficult to test
  - A few functions I would break off into seperate files because the logic is re-used in multiple places (DRY)
    - `submitNewShareholder()`
    - `shareholderGrantsStep()`
    - Form for adding a new grant
  - Abstraction of functionality to follow single responsibility would also allow for easier expansion of features in the future
- Test structure
  - Currently, no file setup or BeforeEach/AfterEach 
    - The setup logic is repeated for each test where it is needed. This should be in the setup for the test 
    file as a whole, or in a beforeEach in the describe block
  - Multiple expects per test
    - Multiple expect statements are not best practice
    - One expect per test keeps the tests smaller and easier to identify in the report what broke, why, and where
  - Timeouts
    - Can either setup as part of the test structure instead of repeating
    - Or test mock data with `jest.mock()` or `jest.fn()` and sample data instead of making real api calls
  - Single responsibility practices above would help the tests be more clean as well
- Package.json
  - Husky, testing utilities, and linting should be dev dependencies
  - Separating out dev dependencies would decrease build times
  - Packages need to be audited for usage. For example zustand is never used in the project

### 4 - Nice to Have
- Edit Shareholders
  - Ability to edit shareholder data
  - Ability to remove shareholders
- TODOs
  - Multiple @TODOs throughout the application code point out good fixes that need to be made to clean up the codebase
- Brittle tests
  - `getByRole()` and other similar structures create brittle tests that are easily broken 
    if the role, classname, or other attribute is altered. It is better practice to use `getByTestId()`
    since the `data-testid` attribute is only used in reference for tests


## Summary
There is a lot of good functionality in the app, but it could benefit from some core usability
improvements and abstraction. A refactor of the test suite is advised to ease expansion of 
test coverage. As well as more component driven abstraction to allow for better test coverage and file scalability.

