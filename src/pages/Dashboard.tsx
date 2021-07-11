import React, {useCallback, useEffect} from "react";
import { VictoryPie } from "victory";
import { Link, useParams } from "react-router-dom";
import { ArrowForwardIcon } from "@chakra-ui/icons";
import {
  Text,
  Heading,
  Stack,
  Button,
  Input,
  StackDivider,
  Table,
  Thead,
  Tr,
  Tbody,
  Td,
  Modal,
  useDisclosure,
  ModalContent,
  Spinner,
  Alert,
  AlertTitle,
  AlertIcon,
  Select,
  FormControl,
  FormLabel,
  Flex,
} from "@chakra-ui/react";
import { Grant, Shareholder } from "../types";
import { useMutation, useQuery, useQueryClient } from "react-query";
import produce from "immer";

export function Dashboard() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const queryClient = useQueryClient();
  const [newShareholder, setNewShareholder] = React.useState<
    Omit<Shareholder, "id" | "grants">
  >({ name: "", group: "employee" });
  const [commonShareVal, setCommonShareVal] = React.useState(1);
  const [preferredShareVal, setPreferredShareVal] = React.useState(5);
  const [marketCap, setMarketCap] = React.useState(0);
  const [displayValueOfShares, setDisplayValueOfShares] = React.useState<'number' | 'value'>("number");
  const [chart, setChart] = React.useState<any[]>([]);
  const { mode } = useParams();

  const shareholderMutation = useMutation<
    Shareholder,
    unknown,
    Omit<Shareholder, "id" | "grants">
  >(
    (shareholder) =>
      fetch("/shareholder/new", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(shareholder),
      }).then((res) => res.json()),
    {
      onSuccess: (data) => {
        queryClient.setQueryData<{ [id: number]: Shareholder } | undefined>(
          "shareholders",
          (s) => {
            if (s) {
              return produce(s, (draft) => {
                draft[data.id] = data;
              });
            }
          }
        );
      },
    }
  );

  // TODO: using this dictionary thing a lot... hmmm
  const grant = useQuery<{ [dataID: number]: Grant }>("grants", () =>
    fetch("/grants").then((e) => e.json())
  );

  const shareholder = useQuery<{ [dataID: number]: Shareholder }>(
    "shareholders",
    () => fetch("/shareholders").then((e) => e.json())
  );

  const getGrantShareValue = useCallback((grant: Grant) => {
    let shareValue = 1;
    if (displayValueOfShares === 'value') {
      let shareTypeValue = grant.type === 'common' ? commonShareVal : preferredShareVal;
      if (isNaN(shareTypeValue)) shareTypeValue = 0;
      shareValue = shareTypeValue;
    }

    return shareValue;
  }, [displayValueOfShares, commonShareVal, preferredShareVal]);

  // TODO: why are these inline?
  const getGroupData = useCallback(() => {
    if (!shareholder.data || !grant.data) {
      return [];
    }
    return ["investor", "founder", "employee"].map((group) => ({
      x: group,
      y: Object.values(shareholder?.data ?? {})
        .filter((s) => s.group === group)
        .flatMap((s) => s.grants)
        .reduce((acc, grantID) => acc + grant.data[grantID].amount * getGrantShareValue(grant.data[grantID]), 0),
    }));
  }, [shareholder.data, grant.data, getGrantShareValue]);

  const getInvestorData = useCallback(() => {
    if (!shareholder.data || !grant.data) {
      return [];
    }
    return Object.values(shareholder.data)
      .map((s) => ({
        x: s.name,
        y: s.grants.reduce(
          (acc, grantID) => acc + grant.data[grantID].amount * getGrantShareValue(grant.data[grantID]),
          0
        ),
      }))
      .filter((e) => e.y > 0);
  }, [shareholder.data, grant.data, getGrantShareValue]);

  const getShareTypeData = useCallback(() => {
    if (!shareholder.data || !grant.data) {
      return [];
    }

    return ["common", "preferred"].map((type) => ({
      x: type,
      y: Object.values(grant?.data ?? {})
          .filter((s) => s.type === type)
          .reduce((acc, grant) => acc + grant.amount * getGrantShareValue(grant), 0),
    }));
  }, [shareholder.data, grant.data, getGrantShareValue]);

  useEffect(() => {
    if (!shareholder.data || !grant.data) {
      return;
    }

    const newMarketCap = Object.values(grant?.data ?? {})
      .reduce((acc, grant) => {
        let shareTypeValue = grant.type === 'common' ? commonShareVal : preferredShareVal;
        if (isNaN(shareTypeValue)) shareTypeValue = 0;

        return acc + (shareTypeValue * grant.amount);
      }, 0);

    setMarketCap(newMarketCap);
  }, [shareholder.data, grant.data, commonShareVal, preferredShareVal]);

  useEffect(() => {
    if (mode === "investor") {
      setChart(getInvestorData());
    } else if (mode === "group") {
      setChart(getGroupData());
    } else if (mode === "share-type") {
      setChart(getShareTypeData());
    } else {
      setChart([]);
    }
  }, [mode, getGroupData, getInvestorData, getShareTypeData]);

  async function submitNewShareholder(e: React.FormEvent) {
    e.preventDefault();
    await shareholderMutation.mutateAsync(newShareholder);
    onClose();
  }

  if (grant.status === "error") {
    return (
        <Alert status="error">
          <AlertIcon />
          <AlertTitle>Error: {grant.error}</AlertTitle>
        </Alert>
    );
  }
  if (grant.status !== "success") {
    return <Spinner />;
  }
  if (!grant.data || !shareholder.data) {
    return (
        <Alert status="error">
          <AlertIcon />
          <AlertTitle>Failed to get any data</AlertTitle>
        </Alert>
    );
  }

  return (
    <Stack>
      <Stack direction="row" justify="space-between" alignItems="baseline">
        <Heading
          size="md"
          bgGradient="linear(to-br, teal.400, teal.100)"
          bgClip="text"
        >
          Fair Share
        </Heading>

        <div>
          <Stack direction="row" paddingBottom="20px">
            <Button
                colorScheme="teal"
                as={Link}
                to="/dashboard/investor"
                variant="ghost"
                isActive={mode === "investor"}
            >
              By Investor
            </Button>
            <Button
                colorScheme="teal"
                as={Link}
                to="/dashboard/group"
                variant="ghost"
                isActive={mode === "group"}
            >
              By Group
            </Button>
            <Button
                colorScheme="teal"
                as={Link}
                to="/dashboard/share-type"
                data-testid="share-type-button"
                variant="ghost"
                isActive={mode === "share-type"}
            >
              By Share Type
            </Button>
          </Stack>

          <Flex>
            <Button
              flex="1"
              onClick={(e) => setDisplayValueOfShares("number")}
              isActive={displayValueOfShares === "number"}
            >
              Number of Shares
            </Button>

            <Button
              flex="1"
              onClick={(e) => setDisplayValueOfShares("value")}
              isActive={displayValueOfShares === "value"}
            >
              Value of Shares
            </Button>
          </Flex>
        </div>

      </Stack>

      <div data-testid="pie-chart">
        <VictoryPie
            colorScale="blue"
            data={chart}
        />
      </div>

      <Stack data-testid="market-cap">
        <Heading
          as="h4"
          size="lg"
        >
          Market Cap: {marketCap}
        </Heading>

        <FormControl>
          <Flex>
            <FormLabel flex="1">
              <span>Common Share value: </span>
              {isNaN(commonShareVal) ? 0 : commonShareVal}
            </FormLabel>
            <Input
                flex="1"
                type="number"
                value={commonShareVal}
                onChange={(e) => setCommonShareVal(parseInt(e.target.value, 10))}
            />
          </Flex>
        </FormControl>

        <FormControl>
          <Flex>
            <FormLabel flex="1">
              <span>Preferred Share value: </span>
              {isNaN(preferredShareVal) ? 0 : preferredShareVal}
            </FormLabel>
            <Input
              flex="1"
              type="number"
              value={preferredShareVal}
              onChange={(e) => setPreferredShareVal(parseInt(e.target.value, 10))}
            />
          </Flex>
        </FormControl>
      </Stack>

      <Stack divider={<StackDivider />}>
        <Heading>Shareholders</Heading>
        <Table>
          <Thead>
            <Tr>
              <Td>Name</Td>
              <Td>Group</Td>
              <Td>Grants</Td>
              <Td>Shares</Td>
            </Tr>
          </Thead>
          <Tbody>
            {Object.values(shareholder.data).map((s) => (
              <Tr key={s.id}>
                <Td>
                  <Link to={`/shareholder/${s.id}`}>
                    <Stack direction="row" alignItems="center">
                      <Text color="teal.600">{s.name}</Text>
                      <ArrowForwardIcon color="teal.600" />
                    </Stack>
                  </Link>
                </Td>
                <Td data-testid={`shareholder-${s.name}-group`}>{s.group}</Td>
                <Td data-testid={`shareholder-${s.name}-grants`}>
                  {s.grants.length}
                </Td>
                <Td data-testid={`shareholder-${s.name}-shares`}>
                  {s.grants.reduce(
                    (acc, grantID) => acc + grant.data[grantID].amount,
                    0
                  )}
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
        <Button onClick={onOpen}>Add Shareholder</Button>
        <Modal isOpen={isOpen} onClose={onClose}>
          <ModalContent>
            <Stack p="10" as="form" onSubmit={submitNewShareholder}>
              <Input
                value={newShareholder.name}
                placeholder="Shareholder Name"
                onChange={(e) =>
                  setNewShareholder((s) => ({ ...s, name: e.target.value }))
                }
              />
              <Select
                placeholder="Type of shareholder"
                value={newShareholder.group}
                onChange={(e) =>
                  setNewShareholder((s) => ({
                    ...s,
                    group: e.target.value as any,
                  }))
                }
              >
                <option value="investor">Investor</option>
                <option value="founder">Founder</option>
                <option value="employee">Employee</option>
              </Select>
              <Button type="submit" colorScheme="teal">
                Save
              </Button>
            </Stack>
          </ModalContent>
        </Modal>
      </Stack>
    </Stack>
  );
}
