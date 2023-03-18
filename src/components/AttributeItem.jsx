import React from "react";
import { Whisper, InputGroup, Input, Popover, Dropdown, MaskedInput, TagInput } from "rsuite";
import MinusIcon from '@rsuite/icons/legacy/MinusCircle';
import DownArrowIcon from '@rsuite/icons/ArrowDown';

export const AttrItem = (props) => {
  const typeRef = React.useRef();
  const [form, setForm] = React.useState(props.value);

  React.useEffect(()=>{
    setForm(props.value);
  }, [props.value]);

  const onTypeChange = (eventKey, event) => {
    const newForm = {...form};
    newForm.type = eventKey;
    setForm(newForm);
    props.onChange(props.index, newForm);
    typeRef.current.close();
  }

  const TypeDropdown = React.forwardRef(({ onSelect, type, ...rest }, ref) => {
    return (
      <Popover ref={ref} {...rest} full>
        <Dropdown.Menu onSelect={onSelect}>
          <Dropdown.Item eventKey='enum'>enum</Dropdown.Item>
          <Dropdown.Item eventKey='boolean'>boolean</Dropdown.Item>
          <Dropdown.Item eventKey='number'>number</Dropdown.Item>
        </Dropdown.Menu>
      </Popover>
    );
  });

  return (
    <InputGroup>
      <Whisper
        placement="bottom"
        trigger="click"
        ref={typeRef}
        speaker={<TypeDropdown onSelect={onTypeChange} />}
      >
        <InputGroup.Addon>
          {form.type} <DownArrowIcon />
        </InputGroup.Addon>
      </Whisper>

      <InputGroup.Addon>
        Name
      </InputGroup.Addon>

      <Input value={form.name} placeholder={'e.g. Rarety'} onChange={v=>{
        const newForm = {...form};
        newForm.name = v;
        setForm(newForm);
        props.onChange(props.index, newForm);
      }} />
      
      { form.type === 'enum' &&
        <>
          <InputGroup.Addon>Enum Names</InputGroup.Addon>
          <TagInput 
            style={{width: '100%'}}
            trigger={['Enter', 'Space', 'Comma']}
            placeholder={'e.g. Common, Rare, Legendary'} 
            onChange={v=>{
              const newForm = {...form};
              newForm.enums = v;
              setForm(newForm);
              props.onChange(props.index, newForm);
            }} 
          />
        </>
      }

      <InputGroup.Button> 
        <MinusIcon onClick={props.onRemove} onClick={()=>props.onDelete(props.index)} /> 
      </InputGroup.Button>

    </InputGroup>
  );
};