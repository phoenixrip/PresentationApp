import React from 'react';
import { useState, ChangeEventHandler, useEffect, useContext } from 'react';
import { Input } from 'antd';

import { calculateFromString } from '../Utils/calculateFromString.js'
import { editorContext, EditorContextTypes } from "../Editor";

type EquationInputProps = {
  value?: string | number,
  //TODO: type this function
  onChange?: any,//ChangeEventHandler<Event>,
  equation?: string,
  min?: number,
  max?: number,
  precision?: number,
  [x: string]: any
}

const operations = ["*", "/", "+", "-", "(", ")"]
const equationVariables = ["w", "h"]

const EquationInput = ({ value, equation, onChange, min, max, precision, ...rest }: EquationInputProps) => {
  const context: EditorContextTypes = useContext(editorContext);
  const equationVariableValues = {
    w: context.project.settings.dimensions.width,
    h: context.project.settings.dimensions.height
  }

  //TODO: doesn't only internalDisplayValue and valueIsValid need to be in state?
  const [internalValue, setInternalValue] = useState(value)
  const [internalEquation, setInternalEquation] = useState(equation ? equation : value)
  const [internalDisplayValue, setInternalDisplayValue] = useState(value)
  const [valueIsValid, setValueIsValid] = useState(true)

  // Toggle displaying value or equation on blur and focus
  const handleBlur = () => { setInternalDisplayValue(internalValue) }
  const handleFocus = () => { setInternalDisplayValue(internalEquation ? internalEquation : internalValue) }

  const handleChange = (e: any) => {
    let valueString = e.target.value as string
    let equation
    let calculatedValue
    let newValue
    // If string has mathematical operators in it see if we can calculate a valid number from it
    if (operations.some(el => valueString.includes(el)) || equationVariables.some(el => valueString.includes(el))) {
      let tempEquationString = valueString
      //If it contains any pre-set variables then replace them in the string with parentheses to preserce multiplication, eg if h is 500 then 2*h is the same as 2(500)
      for (const equationVariable of equationVariables) {
        if (tempEquationString.includes(equationVariable)) {
          //@ts-ignore because of replaceAll
          tempEquationString = tempEquationString.replaceAll(equationVariable, `(${equationVariableValues[equationVariable]})`)
        }
      }

      // Catch errors, eg dividing by 0
      try {
        //Our JS calculator freezes if there are more close brackets ")" than open brackets "(" so check first
        const moreCloseBracketsThanOpenBrackets = (tempEquationString.match(/\(/g) || []).length < (tempEquationString.match(/\)/g) || []).length
        if (moreCloseBracketsThanOpenBrackets) throw "too many close brackets in equation"
        calculatedValue = calculateFromString(tempEquationString)
      } catch (err) {
        // Equation is not valid, update field with input and prompt user for more input, early return until valid
        setInternalDisplayValue(valueString)
        setValueIsValid(false)
        return
      }

      if (Number.isNaN(calculatedValue)) {
        // Equation procued NaN, update field with input and prompt user for more input, early return until valid
        setInternalDisplayValue(valueString)
        setValueIsValid(false)
        return
      } else {
        // Equation produced a valid number, store equation string and calculated Value
        setValueIsValid(true)
        equation = valueString //don't set it to tempEquationString, this preserves variable names in equation
        newValue = calculatedValue
      }
    }

    // Use calculated value if available, if not use valueString and parse as float, check it is parsed correctly
    newValue = calculatedValue ? calculatedValue : parseFloat(valueString)
    if (Number.isNaN(newValue)) {
      setInternalDisplayValue(valueString)
      setValueIsValid(false)
      return
    }

    // If value is too high or low show warning and early return so no callbacks are called until value is valid
    if ((min && newValue < min) || (max && newValue > max)) {
      setInternalValue(newValue)
      setInternalEquation(equation ? equation : newValue) //If equation hasn't been entered use value instead
      setInternalDisplayValue(equation ? equation : newValue)
      setValueIsValid(false)
      return
    }

    //Set precision
    if (precision) newValue = parseFloat(newValue.toFixed(precision))

    //Update state
    setValueIsValid(true)
    setInternalValue(newValue)
    setInternalEquation(equation ? equation : newValue) //If equation hasn't been entered use value instead
    setInternalDisplayValue(equation ? equation : newValue) // Always display equation over value while editing

    // If supplied, run supplied onChange function
    if (onChange) {
      onChange({
        value: newValue,
        equation: equation
      })
    }
  }

  // Holding Ctrl previews result of equation
  const handleKeyDown = (e: any) => {
    if (e?.key === "Control") setInternalDisplayValue(internalValue)
  }

  const handleKeyUp = (e: any) => {
    if (e?.key === "Control") setInternalDisplayValue(internalEquation)
  }


  // Pressing ctrl+enter solves equation in place
  const handleEnter = (e: any) => {
    if (e?.ctrlKey) {
      let equation = internalEquation as string
      let calculatedValue
      // If string has mathematical operators in it or any variable names see if we can calculate a valid number from it
      if (operations.some(el => equation.includes(el)) || equationVariables.some(el => equation.includes(el))) {
        let tempEquationString = equation
        //If it contains any pre-set variables then replace them in the string with parentheses to preserve multiplication, eg if h is 500 then 2*h is the same as 2(500)
        for (const equationVariable of equationVariables) {
          if (tempEquationString.includes(equationVariable)) {
            //@ts-ignore because of replaceAll
            tempEquationString = tempEquationString.replaceAll(equationVariable, `(${equationVariableValues[equationVariable]})`)
          }
        }
        // Catch errors, eg dividing by 0, if it throws exception equation is invalid so we return early
        try { calculatedValue = calculateFromString(tempEquationString) }
        catch { return }


        if (!Number.isNaN(calculatedValue)) {
          setInternalDisplayValue(calculatedValue)
          setInternalEquation(calculatedValue) //delete this to keep the last equation even when folded
          setInternalValue(calculatedValue)

          // If supplied, run supplied onChange function since equation is changed to just value
          if (onChange) {
            onChange({
              value: calculatedValue,
              equation: calculatedValue
            })
          }
        }
      }
    }
  }

  //Update state on prop change
  useEffect(() => {
    if (value !== internalValue) {
      setInternalDisplayValue(value)
      setInternalValue(value)
      setInternalEquation(value)
    }
  }, [value])

  //Update state on prop change
  useEffect(() => {
    if (equation !== internalEquation) setInternalEquation(equation)
  }, [equation])

  return (
    <Input
      value={internalDisplayValue}
      onChange={(e) => handleChange(e)}
      onBlur={handleBlur}
      onFocus={handleFocus}
      onPressEnter={handleEnter}
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
      status={valueIsValid ? "" : "warning"}
      {...rest} />
  )
}

export { EquationInput };