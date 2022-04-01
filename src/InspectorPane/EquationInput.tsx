import React from 'react';
import { useState, ChangeEventHandler, useEffect, useContext } from 'react';
import { Input } from 'antd';
import { SizeType } from 'antd/lib/config-provider/SizeContext';
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
  //TODO: is there a better place to pull these values in? this will pull it in for each input and will also do it regardless of whether the values get used or not
  const equationVariableValues = {
    w: context.state.project.settings.dimensions.width,
    h: context.state.project.settings.dimensions.height
  }

  console.log(context.state.project.settings)


  const [internalValue, setInternalValue] = useState(value)
  const [internalEquation, setInternalEquation] = useState(equation ? equation : value)
  const [internalDisplayValue, setInternalDisplayValue] = useState(value)
  const [valueIsValid, setValueIsValid] = useState(true)

  // Toggle displaying value or equation on blur and focus
  const handleBlur = () => { setInternalDisplayValue(internalValue) }
  const handleFocus = () => { setInternalDisplayValue(internalEquation) }

  const handleChange = (e: any) => {
    let valueString = e.target.value as string
    let equation
    let calculatedValue
    let newValue
    // If string has mathematical operators in it see if we can calculate a valid number from it
    if (operations.some(el => valueString.includes(el)) || equationVariables.some(el => valueString.includes(el))) {
      let tempEquationString = valueString
      //If it contains any pre-set variables then replace them in the string with parentheses to preserce multiplication
      //eg if h is 500 then 2*h is the same as 2(500)
      for (const equationVariable of equationVariables) {
        if (tempEquationString.includes(equationVariable)) {
          //@ts-ignore because of replaceAll

          tempEquationString = tempEquationString.replaceAll(equationVariable, `(${equationVariableValues[equationVariable]})`)
        }
      }

      console.log(tempEquationString)
      // Catch errors, eg dividing by 0
      try {
        calculatedValue = calculateFromString(tempEquationString)
      } catch (err) {
        // Equation is not valid, update field with input and prompt user for more input, early return until valid
        setInternalDisplayValue(valueString)
        setValueIsValid(false)
        return
      }

      if (Number.isNaN(calculatedValue)) {
        // Equation is not valid, update field with input and prompt user for more input, early return until valid
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
    if (onChange) onChange({
      value: newValue,
      equation: equation
    })
  }

  // Pressing enter solves equation and displays it while the input box is focused
  const handleEnter = (e: any) => {
    let equation = e.target.value
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
      try {
        calculatedValue = calculateFromString(tempEquationString)
      } catch {
        return
      }

      if(!Number.isNaN(calculatedValue)) {}
        setInternalDisplayValue(calculatedValue)
      }
    }

  //Update state on prop change by calling the regular change handler
  useEffect(() => {
    if (value !== internalValue) handleChange({ target: { value: new Number(value).toString() } })
  }, [value])

  return (
    <Input
      value={internalDisplayValue}
      onChange={(e) => handleChange(e)}
      onBlur={handleBlur}
      onFocus={handleFocus}
      onPressEnter={handleEnter}
      status={valueIsValid ? "" : "warning"}
      {...rest} />
  )
}

export { EquationInput };