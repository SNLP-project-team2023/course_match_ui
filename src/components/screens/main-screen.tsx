import React, { useRef, useContext, useEffect, useState } from "react";
import { Chip, Pagination, Button, Accordion, AccordionDetails, AccordionSummary, Autocomplete, CircularProgress, Stack, TextField, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import strings from "localization/strings";
import AppLayout from "components/layouts/app-layout";
import { SearchMode } from "types";
import { Course, CourseAlias } from "generated/client";
import CourseCard from "components/generic/course-card";
import { ErrorContext } from "components/contexts/error-handler";
import { useApiClient, useDebouncedCall } from "app/hooks";
import Api from "api";
import { Edit, ExpandMore, Search } from "@mui/icons-material";
import { EmptyBox, PaperCard } from "styled/screens/main-screen";
import theme from "theme";

/**
 * Main screen component
 */
const MainScreen: React.FC = () => {
  const [searchMode, setSearchMode] = useState<SearchMode>(SearchMode.TEXT);
  const [courseAliases, setCourseAliases] = useState<CourseAlias[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [coursesCode, setCourseCode] = useState("");
  const [queryText, setQueryText] = useState("");
  const [emptyQuery, setEmptyQuery] = useState(true);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [selectedLanguageOptions, setSelectedLanguageOptions] = useState<string[]>([]);
  const [selectedSemesterOptions, setSelectedSemesterOptions] = useState<string[]>([]);
  const [queryExampleLanguage, setQueryExampleLanguage] = useState<string>("set1");

  const errorContext = useContext(ErrorContext);
  const { matchApi, courseApi } = useApiClient(Api.getApiClient);

  const coursesPerPage = 5;
  const courseListRef = useRef<HTMLDivElement>(null);
  const queryExamples: { [key: string]: string[] } = {
    set1: [
      "Selitä kvanttilaskenta yksinkertaisin sanoin",
      "I want to learn how to program a robot",
      "股票市场和交易简介"
    ],
    set2: [
      "Explain quantum computing in simple terms",
      "我想学习如何编程机器人",
      "Introduktion till börsen och handel"
    ],
    set3: [
      "Explica la computación cuántica de forma sencilla",
      "Jag vill lära mig att programmera en robot",
      "Johdatus pörssiin ja kaupankäyntiin"
    ],
    set4: [
      "Förklara kvantdatorer i enkla termer",
      "Voglio imparare a programmare un robot",
      "Introducción al mercado de valores y al comercio"
    ],
    set5: [
      "Introducimi all'informatica quantistica",
      "Haluan oppia ohjelmoimaan robotin",
      "Introduction to the stock market and trading"
    ],
    set6: [
      "用简单的术语解释量子计算",
      "Quiero aprender a programar un robot",
      "Introduzione al mercato azionario e al trading"
    ]
  };

  /**
   * Rotates query example language
   */
  const rotateQueryExampleLanguage = () => {
    const languages = Object.keys(queryExamples);
    const currentIndex = languages.indexOf(queryExampleLanguage);
    const nextIndex = (currentIndex + 1) % languages.length;
    setQueryExampleLanguage(languages[nextIndex]);
  };

  useEffect(() => {
    const intervalId = setInterval(rotateQueryExampleLanguage, 5000);
    return () => clearInterval(intervalId);
  }, [queryExampleLanguage]);

  /**
   * Fetches course alias
   */
  const fetchCourseAlias = async () => {
    try {
      const fetchedCourseAliases = await courseApi.coursesGet();
      setCourseAliases(fetchedCourseAliases);
    } catch (error) {
      errorContext.setError(strings.errorHandling.course.fetch);
    }
  };

  useEffect(() => {
    fetchCourseAlias();
  }, []);

  /**
   * On course match
   *
   * @param code course code
   */
  const onCourseCodeMatch = async (code: string) => {
    setLoading(true);
    try {
      const fetchedCourses = await matchApi.matchCourseCodeGet({ courseCode: code });
      setCourses(fetchedCourses);
    } catch (error) {
      errorContext.setError(strings.errorHandling.match.fetch);
    }
    setLoading(false);
  };

  /**
   * On course text match
   *
   * @param text query text
   */
  const onCourseTextMatch = async (text: string) => {
    try {
      const fetchedCourses = await matchApi.matchTextGet({ queryText: text });
      setCourses(fetchedCourses);
    } catch (error) {
      errorContext.setError(strings.errorHandling.match.fetch);
    }
    setLoading(false);
  };

  const onCourseTextMatchDebounced = useDebouncedCall<string>(onCourseTextMatch);

  /**
   * On query text change
   *
   * @param newQueryText new query text
   */
  const onQueryTextChange = (newQueryText: string) => {
    setQueryText(newQueryText);
    setLoading(true);
    setEmptyQuery(newQueryText === "");
    onCourseTextMatchDebounced(newQueryText);
    setPage(1);
  };

  /**
   * On course code change handler 
   */
  const toggleSearchMode = () => {
    if (searchMode === SearchMode.TEXT) {
      setSearchMode(SearchMode.CODE);
      setQueryText("");
    } else {
      setSearchMode(SearchMode.TEXT);
      setCourseCode("");
    }
    setCourses([]);
    setEmptyQuery(true);
  };

  /**
   * Handles page change
   * 
   * @param newPage new page index
   */
  const handlePageChange = (_: React.ChangeEvent<unknown>, newPage: number) => {
    setPage(newPage);
    // Wait for a short delay before scrolling to the first course card on the new page
    setTimeout(() => {
      if (courseListRef.current !== null) {
        courseListRef.current.scrollIntoView({ behavior: "smooth" });
      }
    }, 50);
  };

  /**
   * Render search mode
   */
  const renderSearchMode = () => (
    <ToggleButtonGroup
      color="primary"
      value={searchMode}
      exclusive
    >
      <ToggleButton
        value="left"
        selected={searchMode === SearchMode.TEXT}
        onClick={toggleSearchMode}
        sx={{ borderRadius: theme.spacing(2) }}
      >
        <Stack direction="row" alignItems="center" spacing={1}>
          <Edit/>
          <Typography>{ strings.mainScreen.searchMode.text }</Typography>
        </Stack>
      </ToggleButton>
      <ToggleButton
        color="primary"
        value="right"
        selected={searchMode === SearchMode.CODE}
        onClick={toggleSearchMode}
        sx={{ borderRadius: theme.spacing(2) }}
      >
        <Stack direction="row" alignItems="center" spacing={1}>
          <Search/>
          <Typography>{ strings.mainScreen.searchMode.code }</Typography>
        </Stack>
      </ToggleButton>
    </ToggleButtonGroup>
  );

  /**
   * Renders code search
   */
  const renderCodeSearch = () => {
    const courseOptions = courseAliases.map(alias => ({ label: alias.code, name: `${alias.code} ${alias.name}` }));

    // cut name after the first , or (, then add ... if name is too long
    courseOptions.forEach(option => {
      let commaIndex = option.name.indexOf(",");
      commaIndex === -1 && (commaIndex = option.name.length);
      let bracketIndex = option.name.indexOf("(");
      bracketIndex === -1 && (bracketIndex = option.name.length);
      const cutIndex = Math.min(commaIndex, bracketIndex);
      option.name = option.name.substring(0, cutIndex);
      if (option.name.length > 49) {
        option.name = `${option.name.substring(0, 49)}...`;
      }
    });

    return (
      <Stack
        direction="column"
        alignItems="center"
        width="100%"
        spacing={4}
        padding={2}
      >
        <Typography>{strings.mainScreen.courseCodeDescription}</Typography>
        <Autocomplete
          fullWidth
          disablePortal
          options={courseOptions}
          inputValue={coursesCode}
          /* eslint-disable @typescript-eslint/no-unused-vars */
          renderOption={(props, option, _) => (<Typography noWrap {...props}>{option.name}</Typography>)}
          onInputChange={(_, newInputValue) => setCourseCode(newInputValue) }
          onChange={(_, newValue) => newValue && onCourseCodeMatch(newValue.label) }
          renderInput={params =>
            <TextField
              {...params}
              variant="outlined"
              name="courseCode"
              label={strings.mainScreen.courseCodePlaceholder}
            />}
        />
      </Stack>
    );
  };

  /**
   * Renders examples
   */
  const renderExamples = () => (
    <Stack direction="column" alignItems="center" spacing={2}>
      <Typography variant="h4" textAlign="center">{strings.mainScreen.examplesTitle}</Typography>
      <Stack direction="row" spacing={2} alignItems="stretch">
        {queryExamples[queryExampleLanguage].map((example: string) => (
          <Button
            key={example}
            variant="text"
            onClick={() => onQueryTextChange(example)}
            sx={{
              borderRadius: theme.spacing(1),
              bgcolor: "grey.100",
              textTransform: "none",
              flex: 1
            }}
          >
            {example}
          </Button>
        ))}
      </Stack>
    </Stack>
  );

  /**
   * Renders text search
   */
  const renderTextSearch = () => (
    <Stack
      direction="column"
      alignItems="center"
      width="100%"
      spacing={4}
      padding={2}
    >
      {emptyQuery && renderExamples()}
      <TextField
        fullWidth
        multiline
        rows={6}
        value={queryText}
        variant="outlined"
        label={strings.mainScreen.courseQueryTextPlaceholder}
        onChange={({ target }) => onQueryTextChange(target.value)}
      />
    </Stack>
  );

  /**
   * Renders more options
   */
  const renderMoreOptions = () => (
    <Accordion>
      <AccordionSummary
        expandIcon={<ExpandMore/>}
        aria-controls="panel1a-content"
        id="panel1a-header"
      >
        <Typography>{strings.mainScreen.moreOptions}</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Typography>{strings.generic.notImplemented}</Typography>
      </AccordionDetails>
    </Accordion>
  );

  /**
   * Renders language filter
   */
  const renderLanguageOption = ({ value }: { value: string }) => (
    <Chip
      label={value}
      color={selectedLanguageOptions.includes(value) ? "primary" : "default"}
      onClick={() => {
        if (selectedLanguageOptions.includes(value)) {
          setSelectedLanguageOptions(selectedLanguageOptions.filter(option => option !== value));
        } else {
          setSelectedLanguageOptions([...selectedLanguageOptions, value]);
        }
      }}
    />
  );

  /**
   * Renders semester filter
   */
  const renderSemesterOption = ({ value }: { value: string }) => (
    <Chip
      label={value}
      color={selectedSemesterOptions.includes(value) ? "primary" : "default"}
      onClick={() => {
        if (selectedSemesterOptions.includes(value)) {
          setSelectedSemesterOptions(selectedSemesterOptions.filter(option => option !== value));
        } else {
          setSelectedSemesterOptions([...selectedSemesterOptions, value]);
        }
      }}
    />
  );

  /**
   * Renders search
   */
  const renderSearch = () => (
    <PaperCard elevation={6} sx={{ width: 700 }}>
      <Stack
        direction="column"
        alignItems="center"
        width="100%"
        spacing={2}
        padding={2}
      >
        {renderSearchMode()}
        {searchMode === SearchMode.CODE ? renderCodeSearch() : renderTextSearch()}
        <Stack direction="row" spacing={1}>
          {renderLanguageOption({ value: "en" })}
          {renderLanguageOption({ value: "fi" })}
          {renderLanguageOption({ value: "sv" })}
          {renderSemesterOption({ value: "Autumn" })}
          {renderSemesterOption({ value: "Spring" })}
        </Stack>
      </Stack>
    </PaperCard>
  );

  /**
   * Renders empty result
   */
  const renderEmptyResult = () => (
    <EmptyBox>
      <Stack alignItems="center" spacing={1} color="rgba(0,0,0,0.6)">
        <Search fontSize="large"/>
        <Typography variant="h3">{strings.mainScreen.matchYourCourses}</Typography>
      </Stack>
    </EmptyBox>
  );

  /**
   * Renders empty filter results
   */
  const renderEmptyFilterResults = () => (
    <EmptyBox>
      <Stack alignItems="center" spacing={1} color="rgba(0,0,0,0.6)">
        <Search fontSize="large"/>
        <Typography variant="h3">{strings.mainScreen.noResultsWithFilters}</Typography>
      </Stack>
    </EmptyBox>
  );

  /**
   * Renders courses
   */
  const renderCourses = () => {
    // Add filter to courses
    const filteredCourses = courses.filter(course => {
      if (selectedLanguageOptions.length > 0 && !selectedLanguageOptions.includes(course.language)) {
        return false;
      }
      if (selectedSemesterOptions.length > 0 && !selectedSemesterOptions.some(semester => course.period && course.period.includes(semester))) {
        return false;
      }
      return true;
    });
    
    // Slice courses to display only coursesPerPage
    const startIndex = (page - 1) * coursesPerPage;
    const endIndex = startIndex + coursesPerPage;
    const displayedCourses = filteredCourses.slice(startIndex, endIndex);
  
    return displayedCourses.length <= 0 ? renderEmptyFilterResults() : (
      <Stack spacing={3}>
        <div ref={courseListRef}/>
        {displayedCourses.map(course => (
          <CourseCard key={course.code} course={course} queryText={queryText} coursesCode={coursesCode}/>
        ))}
        <Stack
          direction="row"
          display="flex"
          justifyContent="center"
        >
          { courses.length > coursesPerPage &&
            <Pagination
              count={Math.ceil(filteredCourses.length / coursesPerPage)}
              page={page}
              onChange={handlePageChange}
            />
          }
        </Stack>
      </Stack>
    );
  };

  /**
   * Renders loading
   */
  const renderLoading = () => (
    <EmptyBox>
      <CircularProgress size={48}/>
    </EmptyBox>
  );

  /**
   * Renders search results
   */
  const renderSearchResults = () => {
    if (searchMode === SearchMode.TEXT && emptyQuery) {
      return renderEmptyResult();
    }

    if (loading) {
      return renderLoading();
    }

    return courses.length <= 0 ? renderEmptyResult() : renderCourses();
  };

  return (
    <AppLayout>
      <Stack
        direction="column"
        alignItems="center"
        spacing={4}
        paddingTop={4}
        paddingBottom={4}
        sx={{ overflow: "auto", flex: 1 }}
      >
        {renderSearch()}
        {renderSearchResults()}
      </Stack>
    </AppLayout>
  );
};

export default MainScreen;